# Data Migration Strategy
## AQUA Farming System - Adding User Ownership to Existing Records

**Objective:** Migrate existing database records to assign proper user ownership without losing data.

**Key Requirement:** DO NOT DELETE EXISTING DATA - Preserve all historical records.

---

## Pre-Migration Checklist

- [ ] Back up entire MongoDB database
- [ ] Note current number of records in each collection
- [ ] Verify server is running and accessible
- [ ] Ensure all seed users are created (admin, manthena, giri, rajesh, ramu)
- [ ] Review this migration plan with team

---

## Current Database State

### Collections with userId field added:
1. **Pond** - Requires userId assignment
2. **FeedLog** - Requires userId assignment
3. **WaterLog** - Requires userId assignment
4. **GrowthLog** - Requires userId assignment
5. **MortalityLog** - Requires userId assignment
6. **OperationalLog** - Requires userId assignment
7. **FeedInventory** - Requires userId assignment
8. **ShrimpCountLog** - Requires userId assignment
9. **Expense** - Requires userId assignment
10. **User** - Already has userId

---

## Pre-Migration Inspection

### Step 1: Inspect Current Data
Before running any migration, inspect what data exists:

```javascript
// Run in MongoDB shell or Compass

// Check if there are any existing records without userId
db.ponds.countDocuments({ userId: { $exists: false } })
db.feedlogs.countDocuments({ userId: { $exists: false } })
db.waterlogs.countDocuments({ userId: { $exists: false } })
db.growthlogs.countDocuments({ userId: { $exists: false } })
db.mortalitylogs.countDocuments({ userId: { $exists: false } })
db.operationallogs.countDocuments({ userId: { $exists: false } })
db.feedinventories.countDocuments({ userId: { $exists: false } })
db.shrimpcount logs.countDocuments({ userId: { $exists: false } })
db.expenses.countDocuments({ userId: { $exists: false } })

// Sample one document from each collection to understand structure
db.ponds.findOne()
db.feedlogs.findOne()
db.expenses.findOne()
```

**Record Counts:**
- Ponds without userId: _____
- FeedLogs without userId: _____
- WaterLogs without userId: _____
- GrowthLogs without userId: _____
- MortalityLogs without userId: _____
- OperationalLogs without userId: _____
- FeedInventories without userId: _____
- ShrimpCountLogs without userId: _____
- Expenses without userId: _____

---

## Migration Strategy

### Option A: Assign to Primary Owner (Recommended)

**Rationale:** If most/all data was created by a single farm owner (Bhatraju Raju/manthena), assign all existing records to that owner.

**Steps:**

1. **Identify Primary Owner:**
   - Existing owner user: **manthena** (userId: A7#d2!)
   - Alternative owner: **giri** (userId: G1r!23)

2. **Run Migration for Ponds:**
   ```javascript
   db.ponds.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```
   
   **Verification:**
   ```javascript
   db.ponds.countDocuments({ userId: { $exists: false } })  // Should be 0
   db.ponds.countDocuments({ userId: 'A7#d2!' })  // Should equal total pond count
   ```

3. **Run Migration for Feed Logs:**
   ```javascript
   db.feedlogs.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

4. **Run Migration for Water Logs:**
   ```javascript
   db.waterlogs.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

5. **Run Migration for Growth Logs:**
   ```javascript
   db.growthlogs.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

6. **Run Migration for Mortality Logs:**
   ```javascript
   db.mortalitylogs.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

7. **Run Migration for Operational Logs:**
   ```javascript
   db.operationallogs.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

8. **Run Migration for Feed Inventory:**
   ```javascript
   db.feedinventories.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

9. **Run Migration for Shrimp Count Logs:**
   ```javascript
   db.shrimpcount logs.updateMany(
     { userId: { $exists: false } },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

10. **Run Migration for Expenses:**
    ```javascript
    db.expenses.updateMany(
      { userId: { $exists: false } },
      { $set: { userId: 'A7#d2!' } }
    )
    ```

**Advantages:**
- ✅ Simple, one-step process
- ✅ All historical data preserved
- ✅ No data loss
- ✅ Maintains data relationships

**Disadvantages:**
- ❌ All data assigned to single user
- ❌ No separation if multiple users created records

---

### Option B: Assign by Supervisor/Servant Role

**Rationale:** If ponds can be linked to supervisors/servants, assign data based on these relationships.

**Steps:**

1. **Create Mapping of Supervisors to Ponds:**
   ```javascript
   const supervisorMapping = {
     'Rajesh Kumar': 'k9@P4$',  // supervisor userId
     'Ramu': 'M&5xQ1'  // servant userId
   };
   ```

2. **Update Ponds with Supervisor-based userId:**
   ```javascript
   db.ponds.updateMany(
     { supervisor: 'Rajesh Kumar', userId: { $exists: false } },
     { $set: { userId: 'k9@P4$' } }
   )
   ```

3. **Update Feed Logs based on linked Pond:**
   ```javascript
   // For each pond with userId, find its feed logs and update
   const ponds = db.ponds.find({ userId: { $exists: true } }).toArray();
   ponds.forEach(pond => {
     db.feedlogs.updateMany(
       { pondId: pond.pondId, userId: { $exists: false } },
       { $set: { userId: pond.userId } }
     )
   });
   ```

4. **Repeat for other log types (WaterLog, GrowthLog, MortalityLog, OperationalLog)**

**Advantages:**
- ✅ Data distributed among multiple users
- ✅ Maintains supervisor/servant associations
- ✅ More realistic multi-user setup

**Disadvantages:**
- ❌ More complex process
- ❌ Requires manual mapping if unclear
- ❌ Potential for assignment errors

---

### Option C: Manual Assignment with Review

**Rationale:** Review each record and assign to appropriate user based on content/creation context.

**Steps:**

1. **Export records to CSV for review:**
   ```javascript
   const ponds = db.ponds.find({ userId: { $exists: false } }).toArray();
   // Export to CSV for manual review
   ```

2. **Team reviews each pond:**
   - Determine which user should own it
   - Document assignment decision

3. **Update based on reviewed assignments:**
   ```javascript
   db.ponds.updateOne(
     { _id: ObjectId('...') },
     { $set: { userId: 'A7#d2!' } }
   )
   ```

**Advantages:**
- ✅ Most accurate assignment
- ✅ Maintains proper data semantics
- ✅ Opportunity to validate data quality

**Disadvantages:**
- ❌ Time-consuming
- ❌ Requires manual review
- ❌ Error-prone if many records

---

## Recommended Migration Path

**For AQUA Farming System:**

### Step 1: Backup Database
```bash
# Create MongoDB backup
mongodump --uri "mongodb://127.0.0.1:27017/aqua_farming" --out ./backup_`date +%Y%m%d`
```

### Step 2: Verify Data Exists
```javascript
// Count records in each collection
db.getCollectionNames().forEach(col => {
  const count = db[col].countDocuments();
  console.log(`${col}: ${count} documents`);
});
```

### Step 3: Apply Option A (Recommended - Assign to manthena)
```javascript
// Connect to MongoDB and run:
const ownerId = 'A7#d2!'; // manthena's userId

const collections = [
  'ponds',
  'feedlogs', 
  'waterlogs',
  'growthlogs',
  'mortalitylogs',
  'operationallogs',
  'feedinventories',
  'shrimpcount logs',
  'expenses'
];

collections.forEach(colName => {
  const result = db[colName].updateMany(
    { userId: { $exists: false } },
    { $set: { userId: ownerId } }
  );
  console.log(`${colName}: Updated ${result.modifiedCount} documents`);
});
```

### Step 4: Verify Migration
```javascript
// Confirm no documents missing userId
const collections = [
  'ponds',
  'feedlogs', 
  'waterlogs',
  'growthlogs',
  'mortalitylogs',
  'operationallogs',
  'feedinventories',
  'shrimpcount logs',
  'expenses'
];

collections.forEach(colName => {
  const missing = db[colName].countDocuments({ userId: { $exists: false } });
  const total = db[colName].countDocuments();
  console.log(`${colName}: ${missing} missing userId of ${total} total`);
});
```

### Step 5: Test Data Access
1. Login as manthena (owner123)
2. Verify all historical ponds are now visible
3. Verify all historical logs are now visible
4. Verify another user (e.g., giri) does NOT see manthena's data

### Step 6: Create Additional Test Records
1. Login as giri (owner@123)
2. Create a new pond to verify userId assignment works for new records
3. Verify giri can ONLY see their own pond
4. Verify manthena can ONLY see their ponds (from migration)

---

## Post-Migration Verification Checklist

- [ ] Database backup completed successfully
- [ ] All collections updated with userId
- [ ] No documents have missing userId
- [ ] Data counts match pre-migration totals
- [ ] Historical data is visible to assigned user
- [ ] Other users cannot access historical data
- [ ] New record creation assigns userId correctly
- [ ] Admin panel shows all users
- [ ] Multi-user tests pass (see MULTIUSER_TEST_PLAN.md)

---

## Rollback Procedure (If Needed)

If migration causes issues:

1. **Stop the application**
2. **Restore from backup:**
   ```bash
   mongorestore --uri "mongodb://127.0.0.1:27017/aqua_farming" ./backup_YYYYMMDD
   ```
3. **Verify restored data:**
   ```javascript
   db.ponds.countDocuments()  // Should match pre-migration count
   ```
4. **Review issues and retry migration**

---

## Migration Timeline

**Estimated Duration:** 15-30 minutes total

- Backup: 2-5 minutes
- Data inspection: 3-5 minutes
- Migration execution: 5-10 minutes
- Verification: 5-10 minutes
- Testing: 10-15 minutes

**Best Time to Run:** During low-traffic period or scheduled maintenance window

---

## Notes

- All migrations are **non-destructive** - no data is deleted
- Migration can be run **multiple times** safely (idempotent)
- Historical data **remains unchanged** except for userId addition
- All relationships and references **are preserved**
- New records created after this step **automatically** get userId assigned

---

## Questions & Support

If issues arise during migration:

1. Check server console for errors
2. Review backup can be restored
3. Verify MongoDB connection is active
4. Ensure seed users are created in User collection
5. Consult MULTIUSER_TEST_PLAN.md for test procedures

