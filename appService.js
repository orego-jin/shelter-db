const oracledb = require('oracledb');
const loadEnvFile = require('./utils/envUtil');

const envVariables = loadEnvFile('./.env');

// Database configuration setup. Ensure your .env file has the required database credentials.
const dbConfig = {
    user: envVariables.ORACLE_USER,
    password: envVariables.ORACLE_PASS,
    connectString: `${envVariables.ORACLE_HOST}:${envVariables.ORACLE_PORT}/${envVariables.ORACLE_DBNAME}`,
    poolMin: 1,
    poolMax: 3,
    poolIncrement: 1,
    poolTimeout: 60
};

// initialize connection pool
async function initializeConnectionPool() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('Connection pool started');
    } catch (err) {
        console.error('Initialization error: ' + err.message);
    }
}

async function closePoolAndExit() {
    console.log('\nTerminating');
    try {
        await oracledb.getPool().close(10); // 10 seconds grace period for connections to finish
        console.log('Pool closed');
        process.exit(0);
    } catch (err) {
        console.error(err.message);
        process.exit(1);
    }
}

initializeConnectionPool();

process
    .once('SIGTERM', closePoolAndExit)
    .once('SIGINT', closePoolAndExit);


// ----------------------------------------------------------
// Wrapper to manage OracleDB actions, simplifying connection handling.
async function withOracleDB(action) {
    let connection;
    try {
        connection = await oracledb.getConnection(); // Gets a connection from the default pool 
        return await action(connection);
    } catch (err) {
        console.error(err);
        throw err;
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}


// ----------------------------------------------------------
// Core functions for database operations
// Modify these functions, especially the SQL queries, based on your project's requirements and design.
async function testOracleConnection() {
    return await withOracleDB(async (connection) => {
        return true;
    }).catch(() => {
        return false;
    });
}


// ANIMAL - INSERT
async function insertAnimal(animalID, breed, gender, age, color, shelterAddress, shelterPostalCode) {
    return await withOracleDB(async (connection) => {
        try {
            const result = await connection.execute(
                `INSERT INTO Animal (AnimalID, Breed, Gender, Age, Color, Shelter_Address, Shelter_PostalCode)
                VALUES (:animalID, :breed, :gender, :age, :color, :shelterAddress, :shelterPostalCode)`,
                { animalID, breed, gender, age, color, shelterAddress, shelterPostalCode },
                { autoCommit: true}
            );
            return { success : true, rowAffected: result.rowsAffected };
        } catch (err) {
            if (err.errorNum === 2291) {
                return { success: false, message: 'That shelter does not exist. Please pick a valid shelter.' };
            }
            if (err.errorNum === 1) {
                return { success: false, message: 'An animal with that ID already exists.' };
            }
            if (err.errorNum === 1400) {
                return { success: false, message: 'Please fill in all the required fills' };
            }
            return { success: false, message: 'Insert failed: ' + err.message };
        }
    });
}


// ANIMAL — READ (used to populate Update/Delete dropdowns)
async function getAllAnimals() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT AnimalID, Breed, Gender, Age, Color, Shelter_Address, Shelter_PostalCode
             FROM Animal
             ORDER BY AnimalID`
        );
        return result.rows;
    }).catch(() => []);
}


// ANIMAL - UPDATE
// fields is an object containing only the keys the user checked off,
// e.g. { breed: 'Poodle', age: '3' }
async function updateAnimal(animalID, fields) {
    const columnMap = {
        breed: 'Breed',
        gender: 'Gender',
        age: 'Age',
        color: 'Color',
        shelterAddress: 'Shelter_Address',
        shelterPostalCode: 'Shelter_PostalCode'
    };

    const setClauses = [];
    const binds = { animalID };

    for (const key in fields) {
        if (columnMap[key] && fields[key] !== undefined && fields[key] !== '') {
            setClauses.push(`${columnMap[key]} = :${key}`);
            binds[key] = fields[key];
        }
    }

    if (setClauses.length === 0){
        return { success: false, message: 'No fields provided to update.' };
    } 

    return await withOracleDB(async (connection) => {
        try{
            const result = await connection.execute(
                `UPDATE Animal SET ${setClauses.join(', ')} WHERE AnimalID = :animalID`,
                binds,
                { autoCommit: true }
            );
            if (result.rowsAffected == 0) {
                return { success: false, message: 'No animal found with that ID.' };
            }
            return {success: true };
        } catch (err) {
            if (err.errorNum === 2291) {
                return { success: false, message: 'That shelter does not exist.' };
            }
            return { success: false, message: 'Update failed: ' + err.message };
        }
    });
}


// ANIMAL - DELETE
// Cascades to MedicalRecord, AnimalRescueRecord, AnimalAdoptionRecord,
// AdoptThrough, Animal_AnimalCaretaker, Animal_Volunteer via
// ON DELETE CASCADE on the AnimalID foreign keys (see setup.sql).
async function deleteAnimal(animalID) {
    return await withOracleDB(async (connection) => {
        try {
            const result = await connection.execute(
                `DELETE FROM Animal WHERE AnimalID = :animalID`,
                { animalID },
                { autoCommit: true }
            );
            if (result.rowsAffected === 0) {
                return { success: false, message: 'No animal found with that ID.' };
            }
            return { success: true };
        } catch (err) {
            return { success: false, message: 'Delete failed: ' + err.message };
        }
    });
}


// SHELTER — READ (used to populate shelter dropdowns for Insert/Update)
async function getAllShelters() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(
            `SELECT Address, PostalCode FROM Shelter ORDER BY Address`
        );
        return result.rows;
    }).catch(() => []);
}


// DIVISION — Donors who have donated to every supply category
async function getDonorsAllCategories() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute(`
            SELECT DISTINCT d.Email, d.Name
            FROM Donor d
            WHERE NOT EXISTS (
                (SELECT i.Category FROM Item i)
                MINUS
                (SELECT it.Category
                 FROM DonateTo dt
                 JOIN Supplies s ON dt.UPC = s.UPC
                 JOIN Item it ON s.ItemName = it.ItemName
                 WHERE dt.Email = d.Email)
            )
        `);
        return result.rows;
    }).catch(() => []);
}

// SELECTION
async function selectFromAnimal(attrArray) {
    return await withOracleDB(async (connection) => {
        let query = `SELECT AnimalID, Breed, Gender, Age, Color, Shelter_Address
                    FROM ANIMAL`; 
                    // WHERE breed = 'Ragdoll'`;

        let userValues = {};

        if (attrArray && attrArray.length > 0) {
            query += ` WHERE `;

            attrArray.forEach((attr, index) => {
        
                const logic = attr.logic?.toUpperCase();
                const attribute = attr.attribute;
                // Sanitization
                const key = `key${index}`;

                if (index == 0) {
                    query += `UPPER(TRIM(${attribute})) = UPPER(:${key}) `;
                } else {
                    query += `${logic} UPPER(TRIM(${attribute})) = UPPER(:${key}) `;
                }

                userValues[key] = attr.userInput.trim();
            })
        }

        const result = await connection.execute(query, userValues);
        // console.log(result);
        return result.rows;
    }).catch(() => {
        return [];
    });
}

// PROJECTION
async function projectFromVolunteer(array) {
    return await withOracleDB(async (connection) => {
        const attributes = array.join(", ");
        const query = `SELECT ${attributes}
                    FROM VOLUNTEER v
                    INNER JOIN WORKERS w ON v.vid = w.WorkerID`;

        const result = await connection.execute(query);
        return result.rows;

    }).catch(() => {
        return [];
    });
}

// JOIN
async function joinAdopterAndAnimal(name) {
    return await withOracleDB(async (connection) => {
        const query = `SELECT ad.Name, ani.AnimalID, ani.age, ani.gender, ani.breed
                    FROM Adopter ad
                    LEFT JOIN AdoptionRecord ar ON ad.Email = ar.Adopter_Email
                    LEFT JOIN Animal ani ON ar.AnimalID = ani.AnimalID
                    WHERE UPPER(ad.Name) LIKE '%' || :name || '%' `;
                    // WHERE ad.Name = 'Cindy McDonald' `;

        const result = await connection.execute(query, {name: name.trim().toUpperCase()});
        // console.log(result.rows);
        const rows = result.rows;
        
        // no user record
        if (rows.length == 0) {
            return {status: "user_not_found", data: []};
        }

        // no adoption record for user (animalid == null)
        if (rows[0][1] == null) {
            return {status: "no_record", data: []};
        }

        return {status: "success", data: rows};
    }).catch(() => {
        return [];
    });
}

// ---------------- KAVISHA's QUERIES -----------------------

// returns number of different animals for each Breed of animals
async function getTotalTypesOfAnimals() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT Breed, COUNT(*) FROM ANIMAL GROUP BY Breed');
        return result;
    }).catch(() => {
        return -1;
    });
    
}


// returns number of different animals for each Breed of animals
async function getAllSheltersWithMoreThan5staff() {
    return await withOracleDB(async (connection) => {
        const result = await connection.execute('SELECT w.ShelterAddress, w.ShelterPostalCode, COUNT(a.sID) FROM STAFF a, WORKERS w WHERE w.workerID = a.sID GROUP BY w.ShelterAddress, w.ShelterPostalCode HAVING COUNT(a.sID) > 5');
        return result;
    }).catch(() => {
        return -1;
    });
    
}




 // returns the shelters with more animals than average number of animals across all shelters
async function getShelterWithHigherThanAverageAnimals() {
    return await withOracleDB(async (connection) => {
        const query = `SELECT s.shelter_Address, s.shelter_postalcode, COUNT(s.animalID) 
                                                FROM Animal s
                                                GROUP BY s.shelter_Address, s.shelter_postalcode
                                                HAVING COUNT(s.animalID) > ( 
                                                    SELECT AVG(totalAnimalsInShelter) 
                                                    FROM ( SELECT s.shelter_Address, s.shelter_postalcode, COUNT(s.animalID) as totalAnimalsInShelter
                                                        FROM Animal s
                                                        GROUP BY s.shelter_Address, s.shelter_postalcode )  t)`;

        const result = await connection.execute(query);
        return result;
    }).catch(() => {
        return -1;
    });
    
}



// ---------------END OF KAVISHA's QUERIES-------------------

module.exports = {
    testOracleConnection,
    insertAnimal,
    getAllAnimals,
    updateAnimal,
    deleteAnimal,
    getAllShelters,
    getDonorsAllCategories,
    selectFromAnimal,
    projectFromVolunteer,
    joinAdopterAndAnimal,
    getTotalTypesOfAnimals,
    getAllSheltersWithMoreThan5staff,
    getShelterWithHigherThanAverageAnimals
};