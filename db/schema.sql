-- Demo schema reconstructed from the queries; not an export of the Oracle database.
CREATE TABLE Shelter (Address TEXT NOT NULL, PostalCode TEXT NOT NULL, PRIMARY KEY(Address, PostalCode));
CREATE TABLE Animal (
 AnimalID INTEGER PRIMARY KEY, Breed TEXT NOT NULL, Gender TEXT NOT NULL CHECK(Gender IN ('M','F')),
 Age INTEGER NOT NULL CHECK(Age >= 0), Color TEXT NOT NULL,
 Shelter_Address TEXT NOT NULL, Shelter_PostalCode TEXT NOT NULL,
 FOREIGN KEY(Shelter_Address, Shelter_PostalCode) REFERENCES Shelter(Address, PostalCode)
) STRICT;
CREATE TABLE Workers (
 WorkerID INTEGER PRIMARY KEY, firstName TEXT NOT NULL, lastName TEXT NOT NULL, phoneNumber TEXT,
 ShelterAddress TEXT NOT NULL, ShelterPostalCode TEXT NOT NULL,
 FOREIGN KEY(ShelterAddress, ShelterPostalCode) REFERENCES Shelter(Address, PostalCode)
);
CREATE TABLE Staff (sID INTEGER PRIMARY KEY REFERENCES Workers(WorkerID) ON DELETE CASCADE);
CREATE TABLE Volunteer (vID INTEGER PRIMARY KEY REFERENCES Workers(WorkerID) ON DELETE CASCADE, volunteerHours INTEGER, availability TEXT, startDate TEXT);
CREATE TABLE Adopter (Email TEXT PRIMARY KEY, Name TEXT NOT NULL);
CREATE TABLE AdoptionRecord (AdoptionID INTEGER PRIMARY KEY, Adopter_Email TEXT REFERENCES Adopter(Email), AnimalID INTEGER NOT NULL REFERENCES Animal(AnimalID) ON DELETE CASCADE);
CREATE TABLE Donor (Email TEXT PRIMARY KEY, Name TEXT NOT NULL);
CREATE TABLE Item (ItemName TEXT PRIMARY KEY, Category TEXT NOT NULL);
CREATE TABLE Supplies (UPC TEXT PRIMARY KEY, ItemName TEXT NOT NULL REFERENCES Item(ItemName));
CREATE TABLE DonateTo (Email TEXT REFERENCES Donor(Email), UPC TEXT REFERENCES Supplies(UPC), PRIMARY KEY(Email, UPC));
