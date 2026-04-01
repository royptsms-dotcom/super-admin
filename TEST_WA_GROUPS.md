# WhatsApp Groups Management Testing Guide

## Pre-requisites
- Admin user logged in (token in localStorage)
- At least one job exists in the system
- Database has `wa_group_mappings` table created
- Backend server running at configured API endpoint

## Test Scenarios

### Test 1: Load WA Groups Page
1. Click "Grup WA" in sidebar
2. Expected: Page loads, table shows existing mappings or "Belum ada grup WA" message
3. Expected: Job select in modal is populated with all jobs
4. **Pass/Fail**: ___

### Test 2: Add New WA Group Mapping
1. Click "+ Tambahkan Grup" button
2. Select a job from dropdown
3. Enter WA Group ID (e.g., `120363043556880620@g.us`)
4. Leave "Nama Grup" empty (should auto-fill with job name)
5. Click "Simpan Grup"
6. Expected: Success toast, modal closes, new row appears in table
7. **Pass/Fail**: ___

### Test 3: Edit Existing Mapping
1. From table, click "✏️ Edit" on any row
2. Modal opens with title "Edit Grup WhatsApp"
3. All fields pre-populated with current values
4. Change WA Group ID
5. Click "Update Grup"
6. Expected: Success toast, table updates with new ID
7. **Pass/Fail**: ___

### Test 4: Delete Mapping
1. From table, click "🗑️ Hapus" on any row
2. Confirmation dialog appears
3. Click "OK"
4. Expected: Success toast, row disappears from table
5. **Pass/Fail**: ___

### Test 5: Validation - Duplicate WA Group ID
1. Create mapping with Group ID "test123"
2. Try to create another mapping with same Group ID "test123"
3. Expected: Error message about duplicate
4. **Pass/Fail**: ___

### Test 6: Validation - Missing Required Fields
1. Click "+ Tambahkan Grup"
2. Try to save without selecting job
3. Expected: Error "Pilih job/jabatan terlebih dahulu"
4. **Pass/Fail**: ___

### Test 7: Modal Reset on Close
1. Add a new mapping (or edit existing)
2. Fill some fields
3. Close modal by clicking "✕" or "Batal"
4. Reopen modal
5. Expected: Form is empty with default values
6. **Pass/Fail**: ___

### Test 8: Job List Updates Automatically
1. From Setting page, add a new job
2. Go back to Grup WA page
3. Click "+ Tambahkan Grup"
4. Expected: New job appears in dropdown
5. **Pass/Fail**: ___

## API Test Commands (for quick testing)

### Get All Mappings
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/wa-groups
```

### Create Mapping
```bash
curl -X POST -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"job_id":"JOB_ID","wa_group_id":"120363043556880620@g.us","group_name":"Team Support"}' \
  http://localhost:3000/api/admin/wa-groups
```

### Update Mapping
```bash
curl -X PATCH -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"wa_group_id":"NEW_ID@g.us","group_name":"Updated Name"}' \
  http://localhost:3000/api/admin/wa-groups/MAPPING_ID
```

### Delete Mapping
```bash
curl -X DELETE -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/api/admin/wa-groups/MAPPING_ID
```

## Expected Database State After Tests

### wa_group_mappings table should contain:
| id | job_id | wa_group_id | group_name | created_at | updated_at |
|----|--------|-------------|-----------|------------|------------|
| ... | UUID | 120363043556880620@g.us | Job Name | ... | ... |

## Common Errors to Check

❌ "Pilih job/jabatan terlebih dahulu" - Job not selected
❌ "Masukkan WhatsApp Group ID" - Group ID empty
❌ "Group WA ini sudah terdaftar" - Duplicate WA Group ID
❌ Error at apiFetch - Check Authorization header / token validity
❌ Table empty after selecting Grup WA - Check loadGrupWA() API call

## Notes
- Frontend uses job ID (not name) for API calls ✅
- Group name auto-fills with job name if not provided ✅
- All API responses include error field ✅
- Toast notifications for user feedback ✅
- Confirmation dialog for destructive operations ✅
