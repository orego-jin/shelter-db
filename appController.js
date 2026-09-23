const express = require('express');
const appService = require('./appService');

const router = express.Router();

// ----------------------------------------------------------
// Connection check
// ----------------------------------------------------------
router.get('/check-db-connection', async (req, res) => {
    const isConnect = await appService.testDatabaseConnection();
    if (isConnect) {
        res.send('connected');
    } else {
        res.send('unable to connect');
    }
});

// ============================================================
// SHELTER — lookup data for dropdowns
// ============================================================
router.get('/shelters', async (req, res) => {
    const shelters = await appService.getAllShelters();
    res.json({ data: shelters });
});


// ============================================================
// ANIMAL — INSERT
// ============================================================
router.post('/insert-animal', async (req, res) => {
    const { animalID, breed, gender, age, color, shelterAddress, shelterPostalCode } = req.body;

    if (!animalID || !breed || !gender || !age || !color || !shelterAddress || !shelterPostalCode) {
        return res.status(400).json({ success: false, message: 'Please fill in all fields.' });
    }

    const result = await appService.insertAnimal(
        parseInt(animalID),
        breed,
        gender,
        parseInt(age),
        color,
        shelterAddress,
        shelterPostalCode
    );

    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: result.message });
    }
});


// ============================================================
// ANIMAL — READ (for Update/Delete dropdowns)
// ============================================================
router.get('/animals', async (req, res) => {
    const animals = await appService.getAllAnimals();
    res.json({ data: animals });
});


// ============================================================
// ANIMAL — UPDATE
// ============================================================
router.post('/update-animal', async (req, res) => {
    const { animalID, ...fields } = req.body;

    if (!animalID) {
        return res.status(400).json({ success: false, message: 'Please select an animal to update.' });
    }

    // Coerce age to a number if the user checked that field off
    if (fields.age !== undefined && fields.age !== '') {
        fields.age = parseInt(fields.age);
    }

    const result = await appService.updateAnimal(parseInt(animalID), fields);

    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: result.message });
    }
});


// ============================================================
// ANIMAL — DELETE
// ============================================================
router.post('/delete-animal', async (req, res) => {
    const { animalID } = req.body;

    if (!animalID) {
        return res.status(400).json({ success: false, message: 'Please select an animal to remove.' });
    }

    const result = await appService.deleteAnimal(parseInt(animalID));

    if (result.success) {
        res.json({ success: true });
    } else {
        res.status(400).json({ success: false, message: result.message });
    }
});


// ============================================================
// DIVISION — Donors who have donated to every supply category
// ============================================================
router.get('/donors-all-categories', async (req, res) => {
    const rows = await appService.getDonorsAllCategories();
    res.json({ data: rows });
});


// SELECTION
router.post('/selection', async (req, res) => {

    const attributeArray = req.body.attributes;
    const selectionResult = await appService.selectFromAnimal(attributeArray);

    if (selectionResult) {
        res.json({success: true, data: selectionResult});
    } else {
        console.log("No data from DB");
        res.status(500).json({ success: false, message: err.message });
    }
});

// PROJECTION
router.post('/projection', async (req, res) => {

    const attributeArray = req.body.attributes;

    const projectionResult = await appService.projectFromVolunteer(attributeArray);

    if (projectionResult) {
        res.json({success: true, data: projectionResult});
    } else {
        console.log("No data from DB");
        res.status(500).json({ success: false, message: err.message });
    }
});

// JOIN
router.post('/join', async (req, res) => {
    const { adopterName } = req.body;
    try {
        const joinResult = await appService.joinAdopterAndAnimal(adopterName);
        res.json({ success: true, status:joinResult.status, data: joinResult.data });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});


// AGGREGATION WITH GROUP BY
router.get('/get-all-types-animals', async (req, res) => {
    const totalTypes = await appService.getTotalTypesOfAnimals();
    if (totalTypes) {
        res.json({ 
            success: true, data: totalTypes.rows
        });
    } else {
        res.status(500).json({ 
            success: false, data: totalTypes.rows
        });
    }
});

// AGGREGATION WITH GROUP BY AND HAVING
router.get('/get-shelters-with-more-than-5-staff', async (req, res) => {
    const totalTypes = await appService.getAllSheltersWithMoreThan5staff();
    if (totalTypes) {
        res.json({ 
            success: true, data: totalTypes.rows
        });
    } else {
        res.status(500).json({ 
            success: false, data: totalTypes.rows
        });
    }
});

// NESTED AGGREGATION WITH GROUP BY AND HAVING
router.get('/get-shelters-with-more-than-average-animals', async (req, res) => {
    const totalTypes = await appService.getShelterWithHigherThanAverageAnimals();
    if (totalTypes) {
        res.json({ 
            success: true, data: totalTypes.rows
        });
    } else {
        res.status(500).json({ 
            success: false, data: totalTypes.rows
        });
    }
});

module.exports = router;