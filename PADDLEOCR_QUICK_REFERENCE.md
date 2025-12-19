# PaddleOCR Bounding Box - Quick Reference

## 🚀 Quick Start

### Using the BoundingBoxCanvas Component

```tsx
import { BoundingBoxCanvas } from "@/components/bounding-box-canvas";

// In your component
<BoundingBoxCanvas
  imageUrl={receipt.imageUrl}
  ocrData={receipt.ocr_data}  // Optional - shows plain image if missing
  className="h-full"
/>
```

---

## 📦 API Response Structure

### Backend Response Format

Both `/api/scan` and `/api/scan-ai` now return:

```json
{
  "store": "Walmart",
  "date": "2025-12-16",
  "total": 42.50,
  "items": [...],
  "confidence": 0.85,
  "raw_text": "...",
  
  // NEW FIELD
  "ocr_data": [
    {
      "text": "WALMART",
      "confidence": 0.991,
      "bounding_box": {
        "top_left": [120, 50],
        "top_right": [280, 50],
        "bottom_right": [280, 85],
        "bottom_left": [120, 85]
      }
    }
  ]
}
```

---

## 🎨 Component Props

### BoundingBoxCanvas Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `imageUrl` | `string` | ✅ Yes | URL of the receipt image |
| `ocrData` | `OcrData[]` | ❌ No | Array of detected text regions with bounding boxes |
| `className` | `string` | ❌ No | Additional CSS classes |

### OcrData Interface

```typescript
interface OcrData {
  text: string;              // Detected text
  confidence: number;        // 0-1 (e.g., 0.982 = 98.2%)
  bounding_box: BoundingBox; // Four corner coordinates
}

interface BoundingBox {
  top_left: [number, number];      // [x, y]
  top_right: [number, number];     // [x, y]
  bottom_right: [number, number];  // [x, y]
  bottom_left: [number, number];   // [x, y]
}
```

---

## 🎯 Confidence Color Coding

```typescript
const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.9) return 'rgba(34, 197, 94, 0.8)';   // 🟢 Green - High
  if (confidence >= 0.7) return 'rgba(251, 146, 60, 0.8)'; // 🟠 Orange - Medium
  return 'rgba(239, 68, 68, 0.8)';                         // 🔴 Red - Low
};
```

| Confidence | Color | Meaning |
|------------|-------|---------|
| ≥ 90% | 🟢 Green | High quality - safe to trust |
| 70-90% | 🟠 Orange | Medium quality - review if critical |
| < 70% | 🔴 Red | Low quality - manual verification required |

---

## 📍 Coordinate System

- **Origin (0,0)**: Top-left corner of the image
- **X-axis**: Increases to the right →
- **Y-axis**: Increases downward ↓
- **Units**: Pixels relative to original image dimensions

```
(0,0) ────────────→ X
  │
  │  ┌──────────┐
  │  │  Image   │
  │  │          │
  │  └──────────┘
  ↓
  Y
```

---

## 💡 Usage Examples

### Example 1: Receipt Detail View

```tsx
import { BoundingBoxCanvas } from "./bounding-box-canvas";

export function ReceiptDetailView({ receipt }: { receipt: Receipt }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Left: Image with bounding boxes */}
      <Card className="p-4">
        <BoundingBoxCanvas
          imageUrl={receipt.imageUrl}
          ocrData={receipt.ocr_data}
          className="h-full"
        />
      </Card>
      
      {/* Right: Extracted data */}
      <Card className="p-4">
        <h2>{receipt.store}</h2>
        <p>{receipt.date}</p>
        {/* ... */}
      </Card>
    </div>
  );
}
```

### Example 2: Upload Preview

```tsx
export function UploadPreview({ receipt, imageFile }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const url = URL.createObjectURL(imageFile);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageFile]);
  
  return (
    <div>
      <h3>OCR Detection Results</h3>
      {imageUrl && receipt.ocr_data && (
        <BoundingBoxCanvas
          imageUrl={imageUrl}
          ocrData={receipt.ocr_data}
          className="max-h-[500px]"
        />
      )}
    </div>
  );
}
```

### Example 3: Conditional Rendering

```tsx
// Gracefully handles missing OCR data
<BoundingBoxCanvas
  imageUrl={receipt.imageUrl}
  ocrData={receipt.ocr_data}  // undefined/null = shows plain image
/>

// Explicitly check before rendering
{receipt.ocr_data && receipt.ocr_data.length > 0 ? (
  <BoundingBoxCanvas
    imageUrl={receipt.imageUrl}
    ocrData={receipt.ocr_data}
  />
) : (
  <img src={receipt.imageUrl} alt="Receipt" />
)}
```

---

## 🎮 Interactive Features

### Toggle Visibility

Users can show/hide bounding boxes using the button in the top-right corner:

```tsx
// Component state
const [showBoxes, setShowBoxes] = useState(true);

// Toggle button (built-in)
<Button onClick={() => setShowBoxes(!showBoxes)}>
  {showBoxes ? "Hide Boxes" : "Show Boxes"}
</Button>
```

### Hover Tooltips

When users hover over a bounding box:
1. Box turns yellow with thicker border
2. Tooltip appears showing:
   - Detected text
   - Confidence percentage
3. Semi-transparent yellow fill highlights the region

---

## 🔧 Troubleshooting

### Issue: Bounding boxes don't show

**Possible causes:**
1. `ocr_data` is `undefined` or empty
2. Backend not returning the new format
3. Image hasn't loaded yet

**Debug:**
```tsx
console.log("OCR Data:", receipt.ocr_data);
console.log("OCR Data length:", receipt.ocr_data?.length);
```

### Issue: Boxes are in wrong position

**Possible causes:**
1. Coordinate scaling issue
2. Image dimensions mismatch

**Check:**
```tsx
console.log("Canvas size:", canvas.width, canvas.height);
console.log("Image natural size:", img.naturalWidth, img.naturalHeight);
```

### Issue: Hover not working

**Possible causes:**
1. Canvas CSS size doesn't match internal dimensions
2. Event coordinates not scaled correctly

**Verify:**
```tsx
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width / rect.width;
const scaleY = canvas.height / rect.height;
console.log("Scale factors:", scaleX, scaleY);
```

---

## 🧪 Testing Checklist

### Visual Tests

- [ ] Bounding boxes appear on receipt image
- [ ] Colors match confidence levels (green/orange/red)
- [ ] Toggle button shows/hides boxes correctly
- [ ] Legend displays in bottom-left corner
- [ ] Hover tooltip appears with correct text

### Interaction Tests

- [ ] Hovering changes box color to yellow
- [ ] Tooltip shows exact detected text
- [ ] Confidence percentage displays correctly
- [ ] Mouse leave removes hover effect
- [ ] Toggle button is clickable

### Edge Cases

- [ ] No OCR data - shows plain image
- [ ] Empty OCR data array - shows plain image
- [ ] Very high confidence (>99%) - green boxes
- [ ] Very low confidence (<50%) - red boxes
- [ ] Large receipt (50+ regions) - renders smoothly

### Responsive Design

- [ ] Works on desktop (1920x1080)
- [ ] Works on tablet (768x1024)
- [ ] Works on mobile (375x667)
- [ ] Boxes scale proportionally
- [ ] Touch hover works on mobile

---

## 📊 Performance Tips

### Best Practices

```tsx
// ✅ Good: Let component manage image loading
<BoundingBoxCanvas imageUrl={url} ocrData={data} />

// ❌ Bad: Don't recreate URL on every render
function Component() {
  const url = URL.createObjectURL(file); // Memory leak!
  return <BoundingBoxCanvas imageUrl={url} />;
}

// ✅ Good: Create URL once with cleanup
function Component() {
  const [url, setUrl] = useState<string | null>(null);
  
  useEffect(() => {
    const newUrl = URL.createObjectURL(file);
    setUrl(newUrl);
    return () => URL.revokeObjectURL(newUrl);
  }, [file]);
  
  return <BoundingBoxCanvas imageUrl={url} />;
}
```

### Optimization Hints

1. **Canvas redraws only when needed** - tracked via `useEffect` dependencies
2. **Hover detection is debounced** - only updates on actual region change
3. **Image loaded once** - cached by browser
4. **Polygon calculations** - efficient ray-casting algorithm

---

## 🎯 Key Integration Points

### Where It's Used

1. **Receipt Detail View** (`src/app/(app)/receipts/[id]/page.tsx`)
   - Shows saved receipts with OCR visualization
   - Allows retroactive verification

2. **Upload Preview** (`src/components/upload-dropzone.tsx`)
   - Shows immediately after scanning
   - Enables early error detection

### Data Flow

```
Backend (PaddleOCR)
      ↓
  ocr_data array
      ↓
ParsedReceipt interface
      ↓
BoundingBoxCanvas component
      ↓
Interactive canvas rendering
```

---

## 📚 Related Files

| File | Purpose |
|------|---------|
| [`src/lib/types.ts`](src/lib/types.ts) | TypeScript interfaces |
| [`src/components/bounding-box-canvas.tsx`](src/components/bounding-box-canvas.tsx) | Canvas component |
| [`src/components/receipt-detail-view.tsx`](src/components/receipt-detail-view.tsx) | Receipt detail integration |
| [`src/components/upload-dropzone.tsx`](src/components/upload-dropzone.tsx) | Upload preview integration |
| [`PROJECT_DOCUMENTATION.tex`](PROJECT_DOCUMENTATION.tex) | Full technical docs |
| [`PADDLEOCR_INTEGRATION.md`](PADDLEOCR_INTEGRATION.md) | Implementation summary |

---

## 🆘 Support

### Common Questions

**Q: Why don't I see bounding boxes?**  
A: Check that `receipt.ocr_data` is defined and has elements. The backend must be running and returning the new format.

**Q: Can I customize the colors?**  
A: Yes! Edit the `getConfidenceColor()` function in `bounding-box-canvas.tsx`.

**Q: Does it work with old receipts?**  
A: Yes! If `ocr_data` is missing, it shows the plain image. Fully backward compatible.

**Q: How do I disable the feature?**  
A: Don't pass `ocrData` prop, or pass `undefined`. The component will render a plain image.

---

**Last Updated:** December 18, 2025  
**Version:** 1.0.0  
**Status:** ✅ Production Ready
