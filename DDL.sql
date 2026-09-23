CREATE TABLE ApplicationStatus (
    Status VARCHAR(20) NOT NULL,
    Fee DECIMAL(8,2) NOT NULL,
    PRIMARY KEY (Status)
);

CREATE TABLE Adopter (
    Email VARCHAR2(30) PRIMARY KEY,
    Name VARCHAR2(20) NOT NULL,
    PhoneNumber CHAR(13) NOT NULL,
    Address VARCHAR2(30) NOT NULL
);

CREATE TABLE AdoptionApplication (
    ApplicationNumber INTEGER NOT NULL,
    Status VARCHAR(20) NOT NULL,
    ApplicationDate DATE NOT NULL,
    PRIMARY KEY (ApplicationNumber),
    FOREIGN KEY (Status) REFERENCES ApplicationStatus(Status)
);

CREATE TABLE Donor (
    Email VARCHAR(100) NOT NULL,
    Name VARCHAR(100) NOT NULL,
    PhoneNumber VARCHAR(15),
    Address VARCHAR(200),
    PRIMARY KEY (Email)
);

CREATE TABLE Shelter (
    Email VARCHAR(100),
    Address VARCHAR(100) NOT NULL,
    Capacity INTEGER NOT NULL CHECK (Capacity > 0),
    PostalCode VARCHAR(10) NOT NULL UNIQUE,
    PhoneNumber VARCHAR(15),
    PRIMARY KEY (Address, PostalCode)
);

CREATE TABLE Item (
    ItemName VARCHAR(100) NOT NULL,
    Category VARCHAR(50) NOT NULL,
    PRIMARY KEY (ItemName)
);

CREATE TABLE Supplies (
    UPC VARCHAR(12) NOT NULL,
    Quantity INTEGER NOT NULL CHECK (Quantity >= 0),
    Unit INTEGER NOT NULL,
    ItemName VARCHAR(100) NOT NULL,
    PRIMARY KEY (UPC),
    FOREIGN KEY (ItemName) REFERENCES Item(ItemName)
);

CREATE TABLE DonateTo (
    Email VARCHAR(100) NOT NULL,
    UPC VARCHAR(12) NOT NULL,
    DonationDate DATE NOT NULL,
    DonationType VARCHAR(50) NOT NULL,
    PRIMARY KEY (Email, UPC),
    FOREIGN KEY (Email) REFERENCES Donor(Email),
    FOREIGN KEY (UPC) REFERENCES Supplies(UPC)
);

CREATE TABLE Has_Supplies (
    UPC VARCHAR(12) NOT NULL,
    PostalCode VARCHAR(10) NOT NULL,
    Address VARCHAR(100) NOT NULL,
    PRIMARY KEY (UPC, PostalCode, Address),
    FOREIGN KEY (UPC) REFERENCES Supplies(UPC),
    FOREIGN KEY (Address, PostalCode) REFERENCES Shelter(Address, PostalCode)
);


CREATE TABLE Workers(
	WorkerID CHAR(8) PRIMARY KEY,
	firstName VARCHAR2(50) NOT NULL,
	lastName VARCHAR2(50) NOT NULL,
	phoneNumber VARCHAR2(15),
	startDate DATE,
	shelterAddress VARCHAR2(100) NOT NULL,
	shelterPostalCode VARCHAR(10) NOT NULL,
	FOREIGN KEY (shelterAddress, shelterPostalCode) 
        REFERENCES Shelter(Address, PostalCode)
);

CREATE TABLE SalaryFactors(
    Shift VARCHAR2(50), 
    ExperienceInYears INTEGER, 
    Position VARCHAR2(50), 
    Salary INTEGER,
    PRIMARY KEY (Shift, ExperienceInYears, Position)
);

CREATE TABLE Staff(
    sID CHAR(8) PRIMARY KEY,
    SIN INTEGER NOT NULL,
    Shift VARCHAR2(50), 
    ExperienceInYears INTEGER, 
    Position VARCHAR2(100),
    FOREIGN KEY (sID) 
        REFERENCES Workers(WorkerID)
    	ON DELETE CASCADE,
    UNIQUE(SIN),
    FOREIGN KEY (Shift,ExperienceInYears,Position) REFERENCES SalaryFactors(Shift,ExperienceInYears,Position)
);

CREATE TABLE Admin(
    adminID CHAR(8) PRIMARY KEY,
    FOREIGN KEY (adminID) 
        REFERENCES Staff(sID)
    	ON DELETE CASCADE
);

CREATE TABLE RescuerSalaryFactors(
    NumAnimalsRescued INTEGER PRIMARY KEY, 
    CertificationLevel VARCHAR2(100) NOT NULL
);

-- CREATE TABLE Rescuer(
--     rID CHAR(8) PRIMARY KEY,
--     rescueSpecialty VARCHAR2(50), 
--     numAnimalsRescued INTEGER,
--     FOREIGN KEY (rID) 
--         REFERENCES Staff(sID)
--     	ON DELETE CASCADE,
--     FOREIGN KEY (numAnimalsRescued) REFERENCES RescuerSalaryFactors(numAnimalsRescued)
-- );

CREATE TABLE Rescuer(
    rID CHAR(8) PRIMARY KEY,
    rescueSpecialty VARCHAR2(50), 
    numAnimalsRescued INTEGER UNIQUE,
    FOREIGN KEY (rID) 
        REFERENCES Staff(sID)
    	ON DELETE CASCADE
);

CREATE TABLE AnimalCaretaker(
    acID CHAR(8) PRIMARY KEY,
    FOREIGN KEY (acID) 
        REFERENCES Staff(sID)
    	ON DELETE CASCADE
);

CREATE TABLE Volunteer(
    vID CHAR(8) PRIMARY KEY,
    volunteerHours INTEGER NOT NULL,
    availability CHAR(3),
    FOREIGN KEY (vID) 
        REFERENCES Workers(WorkerID)
    	ON DELETE CASCADE
);

CREATE TABLE Animal ( 
    AnimalID INTEGER PRIMARY KEY,
    Breed VARCHAR2(30),
    Gender CHAR(3),
    Age INTEGER,
    Color VARCHAR2(20),
    Shelter_PostalCode VARCHAR(10) NOT NULL, 
    Shelter_Address VARCHAR(100) NOT NULL,
    FOREIGN KEY (Shelter_Address, Shelter_PostalCode) REFERENCES Shelter (Address, PostalCode)
);

CREATE TABLE Breed (
    Breed VARCHAR2(30) PRIMARY KEY,
    Category VARCHAR2(20)
);
 
CREATE TABLE RescueRecord ( 
    AnimalID INTEGER PRIMARY KEY,
    Rescuer_WorkerID CHAR(8) NOT NULL,
    RescueDate DATE NOT NULL,
    RescueLocation VARCHAR2(100), 
    FOREIGN KEY (AnimalID) REFERENCES Animal,
    FOREIGN KEY (Rescuer_WorkerID) REFERENCES Rescuer
);
 
CREATE TABLE AdoptionRecord ( 
    AnimalID INTEGER PRIMARY KEY,
    Adopter_Email VARCHAR2(30),
    AdoptionFee NUMBER(8,2) NOT NULL,
    AdoptionDate DATE NOT NULL,
    FOREIGN KEY (AnimalID) REFERENCES Animal,
    FOREIGN KEY (Adopter_Email) REFERENCES Adopter
);
 
CREATE TABLE AdoptThrough(
    AnimalID INTEGER,
    AdoptionApplication_ApplicationNumber INTEGER,
    PRIMARY KEY (AnimalID, AdoptionApplication_ApplicationNumber),
    FOREIGN KEY (AnimalID) REFERENCES Animal,
    FOREIGN KEY (AdoptionApplication_ApplicationNumber) REFERENCES AdoptionApplication
);


CREATE TABLE Fills_AdoptionApplication (
    Adopter_Email VARCHAR2(30), 
    AdoptionApplication_ApplicationNumber INTEGER,
    PRIMARY KEY (Adopter_Email, AdoptionApplication_ApplicationNumber),
    FOREIGN KEY (Adopter_Email) REFERENCES Adopter,
    FOREIGN KEY (AdoptionApplication_ApplicationNumber) REFERENCES AdoptionApplication
);
 
CREATE TABLE MedicalRecord (
    AnimalID INTEGER,
    Recordtime TIMESTAMP,
    Diagnosis VARCHAR2(50) NOT NULL,
    Treatment VARCHAR2(50),
    Notes VARCHAR2(100),
    PRIMARY KEY (AnimalID, Recordtime),
    FOREIGN KEY (AnimalID) REFERENCES Animal
);
 
CREATE TABLE AnimalCaretakerTakecare (
    AnimalID INTEGER, 
    AnimalCaretaker_WorkerID CHAR(8),
    PRIMARY KEY (AnimalID , AnimalCaretaker_WorkerID), 
    FOREIGN KEY (AnimalID) REFERENCES Animal,
    FOREIGN KEY (AnimalCaretaker_WorkerID) REFERENCES AnimalCaretaker
);
 
CREATE TABLE VolunteerTakecare (
    AnimalID INTEGER, 
    Volunteer_WorkerID CHAR(8), 
    PRIMARY KEY (AnimalID , Volunteer_WorkerID),
    FOREIGN KEY (AnimalID) REFERENCES Animal,
    FOREIGN KEY (Volunteer_WorkerID) REFERENCES Volunteer
);


-- ---------------------------------------------------
-- ApplicationStatus (5 tuples)
-- ---------------------------------------------------

INSERT INTO ApplicationStatus VALUES ('Pending', 50.00);
INSERT INTO ApplicationStatus VALUES ('Approved', 75.00);
INSERT INTO ApplicationStatus VALUES ('Rejected', 0.00);
INSERT INTO ApplicationStatus VALUES ('Processing', 25.00);
INSERT INTO ApplicationStatus VALUES ('Completed', 100.00);

-- ---------------------------------------------------
-- AdoptionApplication (8 tuples)
-- ---------------------------------------------------

INSERT INTO AdoptionApplication VALUES (1001, 'Pending', DATE '2026-07-01');
INSERT INTO AdoptionApplication VALUES (1002, 'Approved', DATE '2026-07-02');
INSERT INTO AdoptionApplication VALUES (1003, 'Rejected', DATE '2026-07-03');
INSERT INTO AdoptionApplication VALUES (1004, 'Pending', DATE '2026-07-04');
INSERT INTO AdoptionApplication VALUES (1005, 'Approved', DATE '2026-07-05');
INSERT INTO AdoptionApplication VALUES (1006, 'Processing', DATE '2026-07-06');
INSERT INTO AdoptionApplication VALUES (1007, 'Completed', DATE '2026-07-07');
INSERT INTO AdoptionApplication VALUES (1008, 'Pending', DATE '2026-07-08');

-- ---------------------------------------------------
-- Donor (8 tuples)
-- ---------------------------------------------------

INSERT INTO Donor VALUES ('alice@email.com', 'Alice Johnson', '6041111111', '123 Main St');
INSERT INTO Donor VALUES ('bob@email.com', 'Bob Smith', '6042222222', '456 Oak Ave');
INSERT INTO Donor VALUES ('carol@email.com', 'Carol Lee', '6043333333', '789 Pine Rd');
INSERT INTO Donor VALUES ('david@email.com', 'David Wong', '6044444444', '321 Maple St');
INSERT INTO Donor VALUES ('emma@email.com', 'Emma Brown', '6045555555', '654 Cedar Dr');
INSERT INTO Donor VALUES ('frank@email.com', 'Frank Wilson', '6046666666', '789 Birch Ln');
INSERT INTO Donor VALUES ('grace@email.com', 'Grace Chen', '6047777777', '888 Willow Rd');
INSERT INTO Donor VALUES ('henry@email.com', 'Henry Taylor', '6048888888', '999 Lakeview Ave');

-- ---------------------------------------------------
-- Shelter (6 tuples)
-- ---------------------------------------------------

INSERT INTO Shelter VALUES ('north@shelter.ca', '100 King St', 60, 'V6T1A1', '6047000001');
INSERT INTO Shelter VALUES ('east@shelter.ca', '200 Queen St', 40, 'V6T1A2', '6047000002');
INSERT INTO Shelter VALUES ('south@shelter.ca', '300 Prince St', 35, 'V6T1A3', '6047000003');
INSERT INTO Shelter VALUES ('west@shelter.ca', '400 Duke St', 50, 'V6T1A4', '6047000004');
INSERT INTO Shelter VALUES ('central@shelter.ca', '500 George St', 70, 'V6T1A5', '6047000005');
INSERT INTO Shelter VALUES ('valley@shelter.ca', '600 Fraser St', 45, 'V6T1A6', '6047000006');

-- ---------------------------------------------------
-- Item (10 tuples)
-- ---------------------------------------------------

INSERT INTO Item VALUES ('Dog Food', 'Food');
INSERT INTO Item VALUES ('Cat Food', 'Food');
INSERT INTO Item VALUES ('Dog Leash', 'Accessory');
INSERT INTO Item VALUES ('Blanket', 'Bedding');
INSERT INTO Item VALUES ('Chew Toy', 'Toy');
INSERT INTO Item VALUES ('Cat Toy', 'Toy');
INSERT INTO Item VALUES ('Pet Shampoo', 'Hygiene');
INSERT INTO Item VALUES ('Food Bowl', 'Accessory');
INSERT INTO Item VALUES ('Water Bowl', 'Accessory');
INSERT INTO Item VALUES ('Pet Bed', 'Bedding');

-- ---------------------------------------------------
-- Supplies (10 tuples)
-- ---------------------------------------------------

INSERT INTO Supplies VALUES ('111111111111', 50, 1, 'Dog Food');
INSERT INTO Supplies VALUES ('222222222222', 35, 1, 'Cat Food');
INSERT INTO Supplies VALUES ('333333333333', 20, 1, 'Dog Leash');
INSERT INTO Supplies VALUES ('444444444444', 40, 1, 'Blanket');
INSERT INTO Supplies VALUES ('555555555555', 60, 1, 'Chew Toy');
INSERT INTO Supplies VALUES ('666666666666', 18, 1, 'Cat Toy');
INSERT INTO Supplies VALUES ('777777777777', 25, 1, 'Pet Shampoo');
INSERT INTO Supplies VALUES ('888888888888', 30, 1, 'Food Bowl');
INSERT INTO Supplies VALUES ('999999999999', 22, 1, 'Water Bowl');
INSERT INTO Supplies VALUES ('101010101010', 15, 1, 'Pet Bed');

-- ---------------------------------------------------
-- DonateTo (16 tuples)
-- ---------------------------------------------------

INSERT INTO DonateTo VALUES ('alice@email.com', '111111111111', DATE '2026-07-10', 'Food');
INSERT INTO DonateTo VALUES ('alice@email.com', '444444444444', DATE '2026-07-11', 'Supplies');

INSERT INTO DonateTo VALUES ('bob@email.com', '222222222222', DATE '2026-07-12', 'Food');
INSERT INTO DonateTo VALUES ('bob@email.com', '333333333333', DATE '2026-07-13', 'Equipment');

INSERT INTO DonateTo VALUES ('carol@email.com', '555555555555', DATE '2026-07-14', 'Toy');
INSERT INTO DonateTo VALUES ('carol@email.com', '888888888888', DATE '2026-07-15', 'Accessory');

INSERT INTO DonateTo VALUES ('david@email.com', '666666666666', DATE '2026-07-16', 'Toy');
INSERT INTO DonateTo VALUES ('david@email.com', '777777777777', DATE '2026-07-17', 'Hygiene');

INSERT INTO DonateTo VALUES ('emma@email.com', '999999999999', DATE '2026-07-18', 'Accessory');
INSERT INTO DonateTo VALUES ('emma@email.com', '101010101010', DATE '2026-07-19', 'Bedding');

INSERT INTO DonateTo VALUES ('frank@email.com', '111111111111', DATE '2026-07-20', 'Food');
INSERT INTO DonateTo VALUES ('grace@email.com', '222222222222', DATE '2026-07-21', 'Food');
INSERT INTO DonateTo VALUES ('henry@email.com', '333333333333', DATE '2026-07-22', 'Equipment');
INSERT INTO DonateTo VALUES ('frank@email.com', '555555555555', DATE '2026-07-23', 'Toy');
INSERT INTO DonateTo VALUES ('grace@email.com', '777777777777', DATE '2026-07-24', 'Hygiene');
INSERT INTO DonateTo VALUES ('henry@email.com', '888888888888', DATE '2026-07-25', 'Accessory');

-- -----------------------------------------------------
-- -- Has_Supplies 
-- -----------------------------------------------------

INSERT INTO Has_Supplies VALUES ('111111111111', 'V6T1A1', '100 King St');
INSERT INTO Has_Supplies VALUES ('444444444444', 'V6T1A1', '100 King St');
INSERT INTO Has_Supplies VALUES ('777777777777', 'V6T1A1', '100 King St');

INSERT INTO Has_Supplies VALUES ('222222222222', 'V6T1A2', '200 Queen St');
INSERT INTO Has_Supplies VALUES ('888888888888', 'V6T1A2', '200 Queen St');

INSERT INTO Has_Supplies VALUES ('333333333333', 'V6T1A3', '300 Prince St');
INSERT INTO Has_Supplies VALUES ('999999999999', 'V6T1A3', '300 Prince St');

INSERT INTO Has_Supplies VALUES ('555555555555', 'V6T1A4', '400 Duke St');
INSERT INTO Has_Supplies VALUES ('666666666666', 'V6T1A4', '400 Duke St');

INSERT INTO Has_Supplies VALUES ('101010101010', 'V6T1A5', '500 George St');
INSERT INTO Has_Supplies VALUES ('111111111111', 'V6T1A5', '500 George St');

INSERT INTO Has_Supplies VALUES ('222222222222', 'V6T1A6', '600 Fraser St');
INSERT INTO Has_Supplies VALUES ('333333333333', 'V6T1A6', '600 Fraser St');
INSERT INTO Has_Supplies VALUES ('444444444444', 'V6T1A6', '600 Fraser St');
INSERT INTO Has_Supplies VALUES ('555555555555', 'V6T1A6', '600 Fraser St');

-- -----------------------------------------------------
-- -- Workers (18 tuples)
-- -----------------------------------------------------


INSERT INTO Workers VALUES ('W0000001','Carter','Lee','604-555-6789',DATE '2024-01-10','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000002','Emily','Garcia','778-555-7890',DATE '2023-09-12','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000003','Liam','Martin','236-555-8901',DATE '2025-02-15','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000004','Neville','Taylor','604-555-9012',DATE '2024-06-20','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000005','Harry','Anderson','778-555-0123',DATE '2023-04-18','100 King St','V6T1A1');


INSERT INTO Workers VALUES ('W0000006','Olivia','Lee','604-555-6789',DATE '2024-01-10','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000007','Noah','Garcia','778-555-7890',DATE '2023-09-12','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000008','Ava','Martin','236-555-8901',DATE '2025-02-15','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000009','Liam','Taylor','604-555-9012',DATE '2024-06-20','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000010','Mia','Anderson','778-555-0123',DATE '2023-04-18','100 King St','V6T1A1');



INSERT INTO Workers VALUES ('W0000011','Ethan','Thomas','604-555-1122',DATE '2025-01-05','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000012','Isabella','Moore','604-555-2233',DATE '2025-02-10','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000013','James','Jackson','778-555-3344',DATE '2024-11-15','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000014','Charlotte','White','236-555-4455',DATE '2025-03-01','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000015','Benjamin','Harris','604-555-5566',DATE '2024-08-25','100 King St','V6T1A1');


INSERT INTO Workers VALUES ('W0000016','Amelia','Clark','778-555-6677',DATE '2025-04-10','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000017','Lucas','Lewis','604-555-7788',DATE '2025-05-12','100 King St','V6T1A1');
INSERT INTO Workers VALUES ('W0000018','Harper','Walker','236-555-8899',DATE '2025-06-20','100 King St','V6T1A1');


-- -----------------------------------------------------
-- -- Volunteer (5 tuples)
-- -----------------------------------------------------

INSERT INTO Volunteer VALUES ('W0000001',120,'YES');
INSERT INTO Volunteer VALUES ('W0000002',80,'YES');
INSERT INTO Volunteer VALUES ('W0000008',60,'NO');
INSERT INTO Volunteer VALUES ('W0000009',150,'YES');
INSERT INTO Volunteer VALUES ('W0000010',100,'NO');

-- -----------------------------------------------------
-- -- SalaryFactors (5 tuples)
-- -----------------------------------------------------

INSERT INTO SalaryFactors VALUES ('Morning',5,'Manager',75000);
INSERT INTO SalaryFactors VALUES ('Morning',5,'ReceptionDeskManager',55000);
INSERT INTO SalaryFactors VALUES ('Evening',3,'Veterinarian',90000);
INSERT INTO SalaryFactors VALUES ('Evening',3,'ApplicationSupervisor',60000);
INSERT INTO SalaryFactors VALUES ('Night',7,'Coordinator',80000);
INSERT INTO SalaryFactors VALUES ('Morning',5,'Rescuer',60000);
INSERT INTO SalaryFactors VALUES ('Evening',3,'Rescuer',65000);
INSERT INTO SalaryFactors VALUES ('Evening',3,'CatRescuer',62000);
INSERT INTO SalaryFactors VALUES ('Night',7,'Rescuer',70000);
INSERT INTO SalaryFactors VALUES ('Night',8,'Rescuer',72000);
INSERT INTO SalaryFactors VALUES ('Morning',5,'AnimalCaretaker',48000);
INSERT INTO SalaryFactors VALUES ('Morning',5,'DogCaretaker',45000);
INSERT INTO SalaryFactors VALUES ('Evening',3,'AnimalCaretaker',47000);
INSERT INTO SalaryFactors VALUES ('Evening',3,'AnimalTherapy',58000);
INSERT INTO SalaryFactors VALUES ('Night',7,'AnimalFeeder',43000);


-- -----------------------------------------------------
-- -- RescuerSalaryFactors (5 tuples)
-- -----------------------------------------------------

INSERT INTO RescuerSalaryFactors VALUES (15,'Level 1');
INSERT INTO RescuerSalaryFactors VALUES (5,'Level 2');
INSERT INTO RescuerSalaryFactors VALUES (30,'Level 3');
INSERT INTO RescuerSalaryFactors VALUES (40,'Level 4');
INSERT INTO RescuerSalaryFactors VALUES (50,'Level 5');

 -- -----------------------------------------------------
-- -- Staff (15 tuples)
-- -----------------------------------------------------

INSERT INTO Staff VALUES ('W0000001',297563763,'Morning',5,'Manager');
INSERT INTO Staff VALUES ('W0000002',917846287,'Morning',5,'ReceptionDeskManager');
INSERT INTO Staff VALUES ('W0000003',345678901,'Evening',3,'Veterinarian');
INSERT INTO Staff VALUES ('W0000004',456789012,'Evening',3,'ApplicationSupervisor');
INSERT INTO Staff VALUES ('W0000005',567890123,'Night',7,'Coordinator');

INSERT INTO Staff VALUES ('W0000006',234767890,'Morning',5,'Rescuer');
INSERT INTO Staff VALUES ('W0000007',345878901,'Evening',3,'Rescuer');
INSERT INTO Staff VALUES ('W0000008',456989012,'Evening',3,'CatRescuer');
INSERT INTO Staff VALUES ('W0000009',567390123,'Night',7,'Rescuer');
INSERT INTO Staff VALUES ('W0000015',298745628,'Night',8,'Rescuer');


INSERT INTO Staff VALUES ('W0000010',123156789,'Morning',5,'AnimalCaretaker');
INSERT INTO Staff VALUES ('W0000011',234267890,'Morning',5,'DogCaretaker');
INSERT INTO Staff VALUES ('W0000012',345378901,'Evening',3,'AnimalCaretaker');
INSERT INTO Staff VALUES ('W0000013',456489012,'Evening',3,'AnimalTherapy');
INSERT INTO Staff VALUES ('W0000014',123789023,'Night',7,'AnimalFeeder');

-- -----------------------------------------------------
-- -- Admin (5 tuples)
-- -----------------------------------------------------

INSERT INTO Admin VALUES ('W0000001');
INSERT INTO Admin VALUES ('W0000002');
INSERT INTO Admin VALUES ('W0000005');
INSERT INTO Admin VALUES ('W0000003');
INSERT INTO Admin VALUES ('W0000004');

-- -----------------------------------------------------
-- -- Rescuer (5 tuples)
-- -----------------------------------------------------

INSERT INTO Rescuer VALUES ('W0000005','Emergency Rescue',5);
INSERT INTO Rescuer VALUES ('W0000006','Wildlife Rescue',40);
INSERT INTO Rescuer VALUES ('W0000007','Medical Rescue',15);
INSERT INTO Rescuer VALUES ('W0000008','Animal Transport',30);
INSERT INTO Rescuer VALUES ('W0000009','Shelter Rescue',50);

-- -----------------------------------------------------
-- -- AnimalCaretaker (5 tuples)
-- -----------------------------------------------------

INSERT INTO AnimalCaretaker VALUES ('W0000014');
INSERT INTO AnimalCaretaker VALUES ('W0000013');
INSERT INTO AnimalCaretaker VALUES ('W0000012');
INSERT INTO AnimalCaretaker VALUES ('W0000011');
INSERT INTO AnimalCaretaker VALUES ('W0000010');

-----------------------------------------------------
-- Adopter(6 tuples)
-----------------------------------------------------
 
INSERT INTO Adopter VALUES ('bob@email2.com', 'Bob McDonald', '1102342223', '22 Yew St');
INSERT INTO Adopter VALUES ('cindy@email2.com', 'Cindy McDonald', '1102342222', '21 Newyork St');
INSERT INTO Adopter VALUES ('emily@email2.com', 'Emily Grant', '8299298712', '3101 Grant St');
INSERT INTO Adopter VALUES ('daniel@email2.com', 'Daniel Wong', '7781024321', '12 Robson St');
INSERT INTO Adopter VALUES ('eblin@email2.com', 'eblin River', '2231123344', '72 University St');
INSERT INTO Adopter VALUES ('kate@email2.com', 'Kate Tran', '4562224566', '33 Granville St');
 
-----------------------------------------------------
-- Animal(10 tuples) (AnimalID, breed, gender, age, color, shelter_postalcode, shelter_address)
-----------------------------------------------------
INSERT INTO Animal VALUES (1, 'Ragdoll', 'M', 1, 'Black', 'V6T1A1', '100 King St');
INSERT INTO Animal VALUES (2, 'Maine Coon', 'M', 2, 'Ivory', 'V6T1A1', '100 King St'); 
INSERT INTO Animal VALUES (3, 'Border Collie', 'F', 3, 'GreyWhite', 'V6T1A5', '500 George St');
INSERT INTO Animal VALUES (4, 'Golden Retriever', 'M', 4, 'Gold', 'V6T1A3', '300 Prince St' );
INSERT INTO Animal VALUES (5, 'Golden Retriever', 'F', 5, 'Ivory', 'V6T1A2', '200 Queen St' );
INSERT INTO Animal VALUES (6, 'French Bulldog', 'M', 6, 'White', 'V6T1A2', '200 Queen St');
INSERT INTO Animal VALUES (7, 'French Bulldog', 'M', 5, 'Gold', 'V6T1A4', '400 Duke St');
INSERT INTO Animal VALUES (8, 'Bulldog', 'F', 4, 'Black', 'V6T1A4', '400 Duke St');
INSERT INTO Animal VALUES (9, 'Persian', 'F', 3, 'Black', 'V6T1A5', '500 George St');
INSERT INTO Animal VALUES (10, 'Golden Retriever', 'F', 1, 'Gold', 'V6T1A6', '600 Fraser St');
 
-----------------------------------------------------
-- Breed(5 tuples) (Breed, Category)
-----------------------------------------------------
INSERT INTO Breed VALUES ('Golden Retriever', 'Dog');
INSERT INTO Breed VALUES ('Border Collie', 'Dog');
INSERT INTO Breed VALUES ('French Bulldog', 'Dog');
INSERT INTO Breed VALUES ('Bulldog', 'Dog');
INSERT INTO Breed VALUES ('Maine Coon', 'Cat');
INSERT INTO Breed VALUES ('Ragdoll', 'Cat');
INSERT INTO Breed VALUES ('Persian', 'Cat');

-----------------------------------------------------
-- RescueRecord (10 tuples) (AnimalID, Rescuer_WorkerID, RescueDate, RescueLocation)
-----------------------------------------------------
INSERT INTO RescueRecord VALUES (1,'W0000005', DATE '2024-07-16', 'Robson Square');
INSERT INTO RescueRecord VALUES (2,'W0000005', DATE '2025-02-16', 'Kensington Park');
INSERT INTO RescueRecord VALUES (3,'W0000006', DATE '2025-03-06', 'Forestry Building');
INSERT INTO RescueRecord VALUES (4,'W0000005', DATE '2025-03-06', 'Chemical Building');
INSERT INTO RescueRecord VALUES (5,'W0000007', DATE '2025-04-06', 'Biology Building');
INSERT INTO RescueRecord VALUES (6,'W0000006', DATE '2025-02-06', 'Astrology Building');
INSERT INTO RescueRecord VALUES (7,'W0000008', DATE '2025-11-01', 'Science Building');
INSERT INTO RescueRecord VALUES (8,'W0000009', DATE '2026-01-02', '21 Maple st');
INSERT INTO RescueRecord VALUES (9,'W0000006', DATE '2026-01-03', 'UBC CS Building');
INSERT INTO RescueRecord VALUES (10,'W0000007',DATE '2026-02-03', '90 Yew ave');
 
-----------------------------------------------------
-- AdoptionRecord (6 tuples) (AnimalID, Adopter_Email, AdoptionFee, AdoptionDate)
-----------------------------------------------------
INSERT INTO AdoptionRecord VALUES (1, 'bob@email2.com', 200, DATE '2025-08-03');
INSERT INTO AdoptionRecord VALUES (3, 'cindy@email2.com',200, DATE '2025-11-01');
INSERT INTO AdoptionRecord VALUES (5, 'emily@email2.com',100,DATE '2026-01-03');
INSERT INTO AdoptionRecord VALUES (7,'daniel@email2.com',150,DATE '2026-02-20');
INSERT INTO AdoptionRecord VALUES (8, 'eblin@email2.com',200, DATE '2026-02-23');
INSERT INTO AdoptionRecord VALUES (9, 'kate@email2.com',300, DATE '2026-07-03');
 
 
-----------------------------------------------------
-- MedicalRecord(10 tuples) (AnimalID, Timestamp, Diagnosis, Treatment, Notes)
-----------------------------------------------------
INSERT INTO MedicalRecord VALUES (1, TO_TIMESTAMP('2024-07-16 19:03:00', 'YYYY-MM-DD HH24:MI:SS'), 'NO ISSUE', NULL, NULL);
INSERT INTO MedicalRecord VALUES (2, TO_TIMESTAMP('2025-02-16 17:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'MALNUTRITION', NULL, NULL);
INSERT INTO MedicalRecord VALUES (3, TO_TIMESTAMP('2025-03-06 09:30:29', 'YYYY-MM-DD HH24:MI:SS'), 'SMALL SCRATCH ', 'Basic treatment', NULL);
INSERT INTO MedicalRecord VALUES (4, TO_TIMESTAMP('2025-03-06 10:30:31', 'YYYY-MM-DD HH24:MI:SS'), 'Fracture', 'Surgery', 'Extra care required');
INSERT INTO MedicalRecord VALUES (5, TO_TIMESTAMP('2025-04-06 09:30:00', 'YYYY-MM-DD HH24:MI:SS'), 'NO ISSUE', NULL, NULL);
INSERT INTO MedicalRecord VALUES (6, TO_TIMESTAMP('2025-02-06 09:30:10', 'YYYY-MM-DD HH24:MI:SS'), 'NO ISSUE', NULL, NULL);
INSERT INTO MedicalRecord VALUES (7, TO_TIMESTAMP('2025-11-01 09:32:01', 'YYYY-MM-DD HH24:MI:SS'), 'NO ISSUE', NULL, NULL);
INSERT INTO MedicalRecord VALUES (8, TO_TIMESTAMP('2026-01-02 12:30:29', 'YYYY-MM-DD HH24:MI:SS'), 'NO ISSUE', NULL, NULL);
INSERT INTO MedicalRecord VALUES (9, TO_TIMESTAMP('2026-01-03 12:30:29', 'YYYY-MM-DD HH24:MI:SS'), 'Fracture', 'Pain medicine', 'Absolute rest required');
INSERT INTO MedicalRecord VALUES (10, TO_TIMESTAMP('2026-02-03 12:30:29', 'YYYY-MM-DD HH24:MI:SS'), 'NO ISSUE', NULL, NULL);
 
 
-----------------------------------------------------
-- AnimalCaretakerTakecare (10 tuples) (Animal ID, AnimalCaretaker_WorkerID)
-------------------------------------------------------
INSERT INTO AnimalCaretakerTakecare VALUES (1, 'W0000014');
INSERT INTO AnimalCaretakerTakecare VALUES (2, 'W0000014');
INSERT INTO AnimalCaretakerTakecare VALUES (3, 'W0000010');
INSERT INTO AnimalCaretakerTakecare VALUES (4, 'W0000011');
INSERT INTO AnimalCaretakerTakecare VALUES (5, 'W0000012');
INSERT INTO AnimalCaretakerTakecare VALUES (6, 'W0000013');
INSERT INTO AnimalCaretakerTakecare VALUES (7, 'W0000011');
INSERT INTO AnimalCaretakerTakecare VALUES (8, 'W0000012');
INSERT INTO AnimalCaretakerTakecare VALUES (9, 'W0000013');
INSERT INTO AnimalCaretakerTakecare VALUES (10, 'W0000014');
-----------------------------------------------------
-- VolunteerTakecare (5tuples) (Animal ID, Volunteer_WorkerID)
-------------------------------------------------------

INSERT INTO VolunteerTakecare VALUES (10, 'W0000001');
INSERT INTO VolunteerTakecare VALUES (9, 'W0000002');
INSERT INTO VolunteerTakecare VALUES (8, 'W0000008');
INSERT INTO VolunteerTakecare VALUES (7, 'W0000009');
INSERT INTO VolunteerTakecare VALUES (6, 'W0000010');

 
-----------------------------------------------------
-- Fills_AdoptionApplication (7 tuples)
-----------------------------------------------------
 
INSERT INTO Fills_AdoptionApplication VALUES ('bob@email2.com', 1001);
INSERT INTO Fills_AdoptionApplication VALUES ('cindy@email2.com',1002);
INSERT INTO Fills_AdoptionApplication VALUES ('emily@email2.com', 1003);
INSERT INTO Fills_AdoptionApplication VALUES ('daniel@email2.com', 1004);
INSERT INTO Fills_AdoptionApplication VALUES ('eblin@email2.com',1006);
INSERT INTO Fills_AdoptionApplication VALUES ('kate@email2.com', 1007);
INSERT INTO Fills_AdoptionApplication VALUES ('kate@email2.com', 1008);

-----------------------------------------------------
-- AdoptThrough (AnimalID, AdoptionApplication_ApplicationNumber) (5 tuples)
-----------------------------------------------------

INSERT INTO AdoptThrough VALUES (1, 1008);
INSERT INTO AdoptThrough VALUES (3, 1006);
INSERT INTO AdoptThrough VALUES (5, 1007);
INSERT INTO AdoptThrough VALUES (7, 1001);
INSERT INTO AdoptThrough VALUES (8, 1002);
COMMIT;
