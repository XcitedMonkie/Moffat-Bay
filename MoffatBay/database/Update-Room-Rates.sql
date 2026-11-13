-- Client-approved rates; safe to rerun. Existing reservation totals are preserved.
USE MoffatBay;
UPDATE ROOMTYPES
SET basePrice = CASE typeName
    WHEN 'The Morel the Merrier' THEN 126.00
    WHEN 'The Knotty Pine' THEN 141.75
    WHEN 'The Two Hoots' THEN 157.50
    WHEN 'The Unbe-leaf-able Suite' THEN 168.00
    ELSE basePrice
END
WHERE typeName IN ('The Morel the Merrier', 'The Knotty Pine', 'The Two Hoots', 'The Unbe-leaf-able Suite');
SELECT typeName, basePrice FROM ROOMTYPES ORDER BY roomTypeId;
