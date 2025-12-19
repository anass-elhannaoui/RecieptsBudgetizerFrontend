-- Migration: Add ocr_data column to receipts table
-- Description: Stores PaddleOCR bounding box data for receipt visualization
-- Date: 2025-12-19

-- Add ocr_data column to store bounding box information from PaddleOCR
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS ocr_data jsonb DEFAULT NULL;

-- Add comment to document the column
COMMENT ON COLUMN public.receipts.ocr_data IS 'PaddleOCR bounding box data containing text, confidence, and coordinates for each detected region. Used for receipt visualization and OCR quality analysis.';

-- Optional: Create an index for faster queries on ocr_data if needed
-- CREATE INDEX IF NOT EXISTS idx_receipts_ocr_data ON public.receipts USING gin (ocr_data);

-- Example of ocr_data structure:
-- [
--   {
--     "text": "WALMART",
--     "confidence": 0.991,
--     "bounding_box": {
--       "top_left": [120, 50],
--       "top_right": [280, 50],
--       "bottom_right": [280, 85],
--       "bottom_left": [120, 85]
--     }
--   }
-- ]
