-- One-off backfill for copies created before migration 20260905031828_module_provenance.
-- A saved copy is a module whose author differs from its owner; its original is the
-- author's own module with the same name (earliest one wins). Idempotent.
UPDATE "Module" c
SET "sourceModuleId" = (
  SELECT o.id FROM "Module" o
  WHERE o."userId" = c."authorId"
    AND (o."authorId" IS NULL OR o."authorId" = c."authorId")
    AND o.name = c.name
    AND o.id <> c.id
  ORDER BY o."createdAt" ASC
  LIMIT 1
)
WHERE c."authorId" IS NOT NULL
  AND c."authorId" <> c."userId"
  AND c."sourceModuleId" IS NULL
  AND EXISTS (
    SELECT 1 FROM "Module" o
    WHERE o."userId" = c."authorId" AND (o."authorId" IS NULL OR o."authorId" = c."authorId") AND o.name = c.name AND o.id <> c.id
  );
