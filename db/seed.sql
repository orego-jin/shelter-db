-- Fictional sample data covering every query exposed by the demo UI.
INSERT INTO Shelter VALUES ('100 King St','V6B 1A1'),('200 Oak St','V6B 2B2'),('300 Pine St','V6B 3C3');
INSERT INTO Animal VALUES
(1,'Ragdoll','F',2,'White','100 King St','V6B 1A1'),
(2,'Labrador','M',4,'Black','100 King St','V6B 1A1'),
(3,'Poodle','F',1,'Brown','100 King St','V6B 1A1'),
(4,'Ragdoll','M',3,'Gray','100 King St','V6B 1A1'),
(5,'Beagle','F',5,'Brown','100 King St','V6B 1A1'),
(6,'Labrador','F',2,'Gold','200 Oak St','V6B 2B2'),
(7,'Tabby','M',0,'Orange','200 Oak St','V6B 2B2'),
(8,'Poodle','M',6,'White','300 Pine St','V6B 3C3');
INSERT INTO Workers VALUES
(1,'Alex','Kim','604-555-0101','100 King St','V6B 1A1'),
(2,'Sam','Lee','604-555-0102','100 King St','V6B 1A1'),
(3,'Jamie','Park','604-555-0103','100 King St','V6B 1A1'),
(4,'Taylor','Chen','604-555-0104','100 King St','V6B 1A1'),
(5,'Jordan','Singh','604-555-0105','100 King St','V6B 1A1'),
(6,'Morgan','Wong','604-555-0106','100 King St','V6B 1A1'),
(7,'Casey','Brown','604-555-0107','200 Oak St','V6B 2B2'),
(8,'Riley','Smith','604-555-0108','300 Pine St','V6B 3C3'),
(9,'Avery','Green','604-555-0109','100 King St','V6B 1A1'),
(10,'Robin','White','604-555-0110','200 Oak St','V6B 2B2');
INSERT INTO Staff VALUES (1),(2),(3),(4),(5),(6),(7),(8);
INSERT INTO Volunteer VALUES (9,24,'Weekends','2026-01-10'),(10,12,'Weekdays','2026-02-01');
INSERT INTO Adopter VALUES ('cindy@example.test','Cindy McDonald'),('james@example.test','James Lee'),('pat@example.test','Pat Kim');
INSERT INTO AdoptionRecord VALUES (1,'cindy@example.test',1),(2,'cindy@example.test',2),(3,'james@example.test',6);
INSERT INTO Donor VALUES ('alex@example.test','Alex Kim'),('sam@example.test','Sam Lee');
INSERT INTO Item VALUES ('Kibble','Food'),('Ball','Toy'),('Blanket','Bedding'),('Collar','Accessory'),('Shampoo','Hygiene');
INSERT INTO Supplies VALUES ('001','Kibble'),('002','Ball'),('003','Blanket'),('004','Collar'),('005','Shampoo');
INSERT INTO DonateTo VALUES ('alex@example.test','001'),('alex@example.test','002'),('alex@example.test','003'),('alex@example.test','004'),('alex@example.test','005'),('sam@example.test','001');
