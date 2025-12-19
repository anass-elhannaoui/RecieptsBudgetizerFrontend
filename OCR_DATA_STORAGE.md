# 📦 Stockage des Bounding Boxes dans la Base de Données

## 🎯 Problème Identifié

Actuellement, les données `ocr_data` du backend (contenant les bounding boxes de PaddleOCR) sont **uniquement utilisées en mémoire** pendant le scan. Une fois le reçu sauvegardé, ces informations précieuses sont perdues.

## ✅ Solution Implémentée

### 1. **Ajout du champ dans l'interface TypeScript**
📄 [`src/lib/types.ts`](src/lib/types.ts#L54-L68)

```typescript
export interface Receipt {
  // ... autres champs
  ocr_data?: OcrData[]; // ⭐ Nouveau champ pour stocker les bounding boxes
}
```

### 2. **Migration SQL pour ajouter la colonne**
📄 [`supabase-migrations/add-ocr-data-column.sql`](supabase-migrations/add-ocr-data-column.sql)

```sql
ALTER TABLE public.receipts 
ADD COLUMN IF NOT EXISTS ocr_data jsonb DEFAULT NULL;
```

**⚠️ Action requise**: Tu dois exécuter cette migration dans ton dashboard Supabase:
1. Va dans **SQL Editor** dans Supabase
2. Colle le contenu du fichier `add-ocr-data-column.sql`
3. Exécute la requête

### 3. **Sauvegarde des données OCR**
📄 [`src/lib/api-client.ts`](src/lib/api-client.ts#L706) - Fonction `saveReceiptToDatabase()`

```typescript
const receiptDataToSave = {
  // ... autres données
  ocr_data: receipt.ocr_data || null, // ⭐ Sauvegarde des bounding boxes
};
```

### 4. **Récupération des données OCR**
📄 [`src/lib/api-client.ts`](src/lib/api-client.ts)

**Fonction `getReceiptById()`** (ligne ~1027):
```typescript
return {
  // ... autres champs
  ocr_data: data.ocr_data || null, // ⭐ Récupération des bounding boxes
};
```

**Fonction `getReceipts()`** (ligne ~887):
```typescript
return data.map((r: any) => ({
  // ... autres champs
  ocr_data: r.ocr_data || null, // ⭐ Récupération des bounding boxes
}));
```

## 🎨 Utilisation dans l'Interface

Le composant `BoundingBoxCanvas` affiche automatiquement les bounding boxes si elles sont présentes:

📄 [`src/components/receipt-detail-view.tsx`](src/components/receipt-detail-view.tsx)
```tsx
<BoundingBoxCanvas
  imageUrl={receipt.imageUrl!}
  ocrData={receipt.ocr_data || []} // ⭐ Utilise les données de la DB
/>
```

## 🔄 Flux Complet

```
1. User upload receipt
   ↓
2. Backend traite avec PaddleOCR
   ↓
3. Backend retourne: { data: {...}, ocr_data: [{text, confidence, bounding_box}] }
   ↓
4. Frontend affiche les bounding boxes (BoundingBoxCanvas)
   ↓
5. User sauvegarde le receipt
   ↓
6. ocr_data stocké dans la colonne JSONB de Supabase
   ↓
7. Plus tard, user ouvre le receipt
   ↓
8. ocr_data récupéré depuis la DB
   ↓
9. Bounding boxes affichées à nouveau! ✨
```

## 📊 Structure des Données

### Backend Response
```json
{
  "data": {
    "store": "ODEON",
    "date": "2024-12-19",
    "total": 15.50
  },
  "ocr_data": [
    {
      "text": "ODEON",
      "confidence": 0.989,
      "bounding_box": [[120, 45], [280, 45], [280, 85], [120, 85]]
    },
    {
      "text": "Total: 15.50€",
      "confidence": 0.956,
      "bounding_box": [[100, 450], [320, 450], [320, 485], [100, 485]]
    }
  ]
}
```

### Database Column (JSONB)
```json
[
  {
    "text": "ODEON",
    "confidence": 0.989,
    "bounding_box": [[120, 45], [280, 45], [280, 85], [120, 85]]
  }
]
```

## 🎯 Avantages du Stockage

1. **📈 Audit Qualité**
   - Voir quelles régions avaient une faible confiance
   - Analyser les patterns d'erreur OCR

2. **🔍 Débogage**
   - Comprendre pourquoi certains champs ont été mal détectés
   - Visualiser exactement ce que l'OCR a vu

3. **📊 Analytics**
   - Mesurer la performance de PaddleOCR sur différents types de reçus
   - Identifier les magasins problématiques

4. **🎨 UX Améliorée**
   - Les users peuvent voir les bounding boxes même sur des vieux reçus
   - Transparence sur le processus de détection

## 🧪 Test

1. Execute la migration SQL dans Supabase
2. Upload un nouveau receipt
3. Les bounding boxes s'affichent immédiatement
4. Refresh la page
5. Les bounding boxes s'affichent toujours! ✅

## 📝 Notes Techniques

- **Type de colonne**: `JSONB` pour performance et requêtes flexibles
- **Valeur par défaut**: `NULL` (pas de données si OCR non exécuté)
- **Taille**: ~2-5 KB par reçu (22 régions OCR)
- **Impact performance**: Négligeable (JSONB indexé si besoin)
