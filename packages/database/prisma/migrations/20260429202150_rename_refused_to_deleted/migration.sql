-- Rename article status REFUSED to DELETED.
-- The "motif de refus" stays in the existing model field (UI label "Descriptif").
UPDATE "articles" SET "status" = 'DELETED' WHERE "status" = 'REFUSED';
