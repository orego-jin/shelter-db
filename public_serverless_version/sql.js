'use strict';

let db;
//
async function initDB() {
    try {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
        });

        // initiate db
        db = new SQL.Database();
        
        const schemaResponse = await fetch('../db/schema.sql');
        const schemaSql = await schemaResponse.text();
        db.exec(schemaSql);

        const seedResponse = await fetch('../db/seed.sql');
        const seedSql = await seedResponse.text();
        db.exec(seedSql);

        console.log("initiated db with seed data");
        ``

    } catch (error) {
        console.error("Failed to load DB.", error);
    }
}

initDB();

//
// async function initDB() {
//     if (db) return db;
//     if (location.protocol === 'file:') {
//         throw new Error('Open this demo through a static HTTP server, not by double-clicking index.html. See README.md.');
//     }
//     if (typeof initSqlJs !== 'function') {
//         throw new Error('SQLite could not load. Check vendor/sql-wasm.js.');
//     }
//     const SQL = await initSqlJs({ locateFile: file => `./vendor/${file}` });
//     db = new SQL.Database();
//     try {
//         db.run('PRAGMA foreign_keys = ON');
//         db.run('BEGIN');
//         for (const file of ['schema.sql', 'seed.sql']) {
//             const response = await fetch(`./db/${file}`);
//             if (!response.ok) throw new Error(`Could not load db/${file} (HTTP ${response.status}).`);
//             db.run(await response.text());
//         }
//         db.run('COMMIT');
//         return db;
//     } catch (error) {
//         db.close();
//         db = undefined;
//         throw error;
//     }
// }

// db.exec() returns [{ columns: [...], values: [[...], ...] }].
// A SELECT with no rows returns [], so use an empty array as the fallback.
function query(sql, params = []) {
    const result = db.exec(sql, params);
    return result[0]?.values ?? [];
}

const animalColumns = { breed:'Breed', gender:'Gender', age:'Age', color:'Color', shelterAddress:'Shelter_Address', shelterPostalCode:'Shelter_PostalCode' };
function integer(value, label, min=0) {
    if (value === '' || value === null || value === undefined || !Number.isSafeInteger(Number(value)) || Number(value)<min) throw new Error(`${label} must be a whole number of at least ${min}.`);
    return Number(value);
}
function field(key, value) {
    if(key==='age') return integer(value,'Age');
    if(typeof value!=='string'||!value.trim()) throw new Error('Please fill in all required fields.');
    if(key==='gender'&&!['M','F'].includes(value)) throw new Error('Choose a valid gender.');
    return value.trim();
}

function getAnimals() {
    return query('SELECT AnimalID, Breed, Gender, Age, Color, Shelter_Address, Shelter_PostalCode FROM Animal ORDER BY AnimalID');
}

function getShelters() {
    return query('SELECT Address, PostalCode FROM Shelter ORDER BY Address');
}

function insertAnimal(body) {
    const id=integer(body.animalID,'Animal ID',1);
    const values=Object.keys(animalColumns).map(key=>field(key,body[key]));
    db.run('INSERT INTO Animal (AnimalID, Breed, Gender, Age, Color, Shelter_Address, Shelter_PostalCode) VALUES (?,?,?,?,?,?,?)',[id,...values]);
    return {success:true};
}

function updateAnimal(body) {
    const keys=Object.keys(animalColumns).filter(key=>Object.hasOwn(body,key));
    if(!keys.length) throw new Error('Choose at least one field to update.');
    const values=keys.map(key=>field(key,body[key]));
    db.run(`UPDATE Animal SET ${keys.map(key=>animalColumns[key]+' = ?').join(', ')} WHERE AnimalID = ?`,[...values,integer(body.animalID,'Animal ID',1)]);
    if(!db.getRowsModified()) throw new Error('No animal found with that ID.');
    return {success:true};
}

function deleteAnimal(animalID) {
    db.run('DELETE FROM Animal WHERE AnimalID = ?',[integer(animalID,'Animal ID',1)]);
    if(!db.getRowsModified()) throw new Error('No animal found with that ID.');
    return {success:true};
}

function selectAnimals(attributes) {
    const allowed={breed:'Breed',gender:'Gender',age:'Age',color:'Color',shelter:'Shelter_Address'};
    if(!Array.isArray(attributes)) throw new Error('Invalid search conditions.');
    const params=[];
    const clauses=attributes.map((attr,index)=>{
        if(!Object.hasOwn(allowed,attr.attribute)) throw new Error('Invalid search field.');
        const logic=String(attr.logic||'').toUpperCase();
        if(index&&!['AND','OR'].includes(logic)) throw new Error('Choose AND or OR.');
        params.push(String(attr.userInput??'').trim());
        return `${index?logic+' ':''}UPPER(TRIM(${allowed[attr.attribute]})) = UPPER(?)`;
    });
    return query('SELECT AnimalID, Breed, Gender, Age, Color, Shelter_Address FROM Animal'+(clauses.length?' WHERE '+clauses.join(' '):'')+' ORDER BY AnimalID',params);
}

function getVolunteers(attributes) {
    const allowed=['WorkerID','firstName','lastName','phoneNumber','volunteerHours','availability','startDate'];
    if(!Array.isArray(attributes)||attributes.some(a=>!allowed.includes(a))) throw new Error('Invalid volunteer columns.');
    return attributes.length?query(`SELECT ${attributes.join(', ')} FROM Volunteer v JOIN Workers w ON v.vID=w.WorkerID ORDER BY w.WorkerID`):[];
}

function findAdoptions(adopterName) {
    const name=String(adopterName||'').trim();
    if(!name) throw new Error('Enter an adopter name.');
    const rows=query(`SELECT ad.Name, ani.AnimalID, ani.Age, ani.Gender, ani.Breed FROM Adopter ad
        LEFT JOIN AdoptionRecord ar ON ad.Email=ar.Adopter_Email LEFT JOIN Animal ani ON ar.AnimalID=ani.AnimalID
        WHERE UPPER(ad.Name) LIKE ? ORDER BY ad.Name, ani.AnimalID`,['%'+name.toUpperCase()+'%']);
    const adopted=rows.filter(r=>r[1]!==null);
    return {status:!rows.length?'user_not_found':!adopted.length?'no_record':'success',data:adopted};
}

function getDonorsAllCategories() {
    return query(`SELECT DISTINCT d.Email,d.Name FROM Donor d
    WHERE NOT EXISTS (SELECT i.Category FROM Item i WHERE NOT EXISTS (
        SELECT 1 FROM DonateTo dt JOIN Supplies s ON dt.UPC=s.UPC JOIN Item it ON s.ItemName=it.ItemName
        WHERE dt.Email=d.Email AND it.Category=i.Category)) ORDER BY d.Name`);
}

function getAnimalsByBreed() {
    return query('SELECT Breed, COUNT(*) FROM Animal GROUP BY Breed ORDER BY Breed');
}

function getStaffCoverage() {
    return query(`SELECT w.ShelterAddress,w.ShelterPostalCode,COUNT(a.sID)
    FROM Staff a JOIN Workers w ON w.WorkerID=a.sID GROUP BY w.ShelterAddress,w.ShelterPostalCode HAVING COUNT(a.sID)>5`);
}

function getAboveAverageShelters() {
    return query(`SELECT Shelter_Address,Shelter_PostalCode,COUNT(AnimalID)
    FROM Animal GROUP BY Shelter_Address,Shelter_PostalCode HAVING COUNT(AnimalID)>
    (SELECT AVG(total) FROM (SELECT COUNT(AnimalID) AS total FROM Animal GROUP BY Shelter_Address,Shelter_PostalCode))`);
}
