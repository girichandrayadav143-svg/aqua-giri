# Multi-User Data Isolation Test Plan
## AQUA Farming System - User Segregation Validation

**Purpose:** Verify that each user's data is completely isolated and cannot be accessed by other users, even with direct API access.

**Test Date:** [To be filled]  
**Tester:** [To be filled]  
**Status:** [Pending]

---

## Credentials for Testing

### Test Account 1: User A
- **Username:** test_user_a
- **Email:** testa@aquafarm.io
- **Password:** TestUserA@123
- **Expected Role:** Owner
- **Purpose:** Create ponds, feed logs, water logs, growth logs, expenses

### Test Account 2: User B
- **Username:** test_user_b
- **Email:** testb@aquafarm.io
- **Password:** TestUserB@123
- **Expected Role:** Owner
- **Purpose:** Create separate ponds and data, verify isolation

### Pre-existing Admin Account (for cleanup)
- **Username:** admin
- **Password:** admin@123
- **Role:** Admin
- **Purpose:** Manage test accounts if needed

---

## Test Procedure

### Phase 1: Account Creation

#### Step 1.1: Create User A Account
1. Open http://localhost:5000
2. Click "Register" tab
3. Fill in registration form:
   - Full Name: Test User A
   - Email: testa@aquafarm.io
   - Username: test_user_a
   - Password: TestUserA@123
   - Confirm Password: TestUserA@123
4. Click "Register" button
5. **Expected Result:** Account created, automatically logged in, dashboard visible
6. **Record:** User ID from dashboard: _______________

#### Step 1.2: Create User B Account
1. Click "Logout" button
2. Click "Register" tab again
3. Fill in registration form:
   - Full Name: Test User B
   - Email: testb@aquafarm.io
   - Username: test_user_b
   - Password: TestUserB@123
   - Confirm Password: TestUserB@123
4. Click "Register" button
5. **Expected Result:** Account created, automatically logged in, dashboard shows EMPTY (no ponds from User A)
6. **Record:** User ID from dashboard: _______________
7. **CRITICAL VERIFICATION:** User B sees ONLY their own empty dashboard, NO User A data
8. **Result:** ✅ PASS / ❌ FAIL

---

### Phase 2: Data Creation

#### Step 2.1: User A - Create Test Pond
1. Login as User A (test_user_a / TestUserA@123)
2. Navigate to "Pond Management" tab
3. Click "Add Pond" button
4. Fill in form:
   - Pond Name: User A Pond 1
   - Pond Size: 2.5 acres
   - Stocking Date: [Today's date]
   - Status: Active
   - Remarks: This is User A's test pond
5. Click "Save Pond"
6. **Expected Result:** Pond created successfully
7. **Record Pond ID:** _______________

#### Step 2.2: User A - Add Feed Log
1. In Pond Management, find "User A Pond 1"
2. Click "Quick Feed Entry"
3. Fill form:
   - Feed Slot: 07:00 AM
   - Feed Quantity: 5.5 kg
   - Consumption: 100% Consumed
   - Remarks: Morning feed for User A pond
4. Click "Save Feed Log"
5. **Expected Result:** Feed log recorded
6. **Record:** _______________

#### Step 2.3: User A - Add Water Quality Log
1. In Pond Management, find "User A Pond 1"
2. Click "Water Quality Log"
3. Fill form:
   - pH Level: 7.2
   - Dissolved Oxygen: 5.8
   - Temperature: 28.5°C
   - Salinity: 15 ppt
   - Ammonia: 0.05 ppm
4. Click "Save Water Log"
5. **Expected Result:** Water log recorded
6. **Record:** _______________

#### Step 2.4: User B - Create Different Pond
1. Logout from User A
2. Login as User B (test_user_b / TestUserB@123)
3. Navigate to "Pond Management" tab
4. Click "Add Pond" button
5. Fill in form:
   - Pond Name: User B Pond 1
   - Pond Size: 3.0 acres
   - Stocking Date: [Today's date]
   - Status: Active
   - Remarks: This is User B's test pond
6. Click "Save Pond"
7. **Expected Result:** Pond created successfully, User B dashboard shows ONLY this pond
8. **Record Pond ID:** _______________

#### Step 2.5: User B - Add Different Data
1. In Pond Management, find "User B Pond 1"
2. Click "Quick Feed Entry"
3. Fill form:
   - Feed Slot: 10:00 AM
   - Feed Quantity: 7.2 kg
   - Consumption: 95% Consumed
   - Remarks: Morning feed for User B pond
4. Click "Save Feed Log"
5. **Expected Result:** Feed log recorded for User B only

---

### Phase 3: Data Isolation Verification

#### Step 3.1: User B Dashboard - Verify User A Data NOT Visible
1. While logged in as User B
2. Navigate to "Pond Management" tab
3. **Expected Result:** 
   - Only "User B Pond 1" is displayed
   - "User A Pond 1" is NOT visible
   - User A's feed logs are NOT visible
   - User A's water logs are NOT visible
4. **Result:** ✅ PASS / ❌ FAIL

#### Step 3.2: User A Dashboard - Verify User B Data NOT Visible
1. Logout User B
2. Login as User A (test_user_a / TestUserA@123)
3. Navigate to "Pond Management" tab
4. **Expected Result:**
   - Only "User A Pond 1" is displayed
   - "User B Pond 1" is NOT visible
   - User A's feed logs are displayed (from Step 2.2)
   - User B's feed logs are NOT visible
5. **Result:** ✅ PASS / ❌ FAIL

#### Step 3.3: API-Level Isolation Test (Direct API Call)
1. Open browser Developer Tools (F12)
2. Go to "Network" tab
3. Login as User A
4. Copy the JWT token from localStorage:
   - Open Console tab
   - Type: `localStorage.getItem('manthena_aqua_jwt')`
   - Copy the token (without quotes)
5. **Expected Result:** Token is User A's JWT

#### Step 3.4: Attempt to Access User B's Pond via API
1. Still in Console, run:
   ```javascript
   fetch('/api/ponds', {
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('manthena_aqua_jwt')
     }
   }).then(r => r.json()).then(d => console.log('User A Ponds:', d))
   ```
2. **Expected Result:** Response contains ONLY User A's pond
3. **Record Response:** [Paste JSON response]
4. **Verification:** Confirm "User B Pond 1" is NOT in the response
5. **Result:** ✅ PASS / ❌ FAIL

#### Step 3.5: Verify Backend Authorization Check
1. Logout from User A
2. Login as User B
3. Copy User B's JWT token
4. Logout User B, Login as User A again
5. In Console, try to query with User B's token:
   ```javascript
   const userBToken = 'PASTE_USER_B_TOKEN_HERE';
   fetch('/api/ponds', {
     headers: {
       'Authorization': 'Bearer ' + userBToken
     }
   }).then(r => r.json()).then(d => console.log('Attempt with User B token:', d))
   ```
6. **Expected Result:** Response contains ONLY User B's ponds, NOT User A's
7. **Record Response:** [Paste JSON response]
8. **Critical Check:** User B's pond list does NOT include User A's data
9. **Result:** ✅ PASS / ❌ FAIL

---

### Phase 4: Unauthorized Access Attempt

#### Step 4.1: Attempt to Delete Another User's Pond
1. Get User A's pond ID from Step 2.1: _______________
2. Login as User B
3. In Console, attempt to delete User A's pond:
   ```javascript
   fetch('/api/ponds/[USER_A_POND_ID]', {
     method: 'DELETE',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('manthena_aqua_jwt')
     }
   }).then(r => r.json()).then(d => console.log('Delete Result:', d))
   ```
4. **Expected Result:** 
   - HTTP Status: 403 (Forbidden) or 404 (Not Found)
   - Message: "Not authorized" or similar
   - User A's pond is NOT deleted
5. **Record Response:** [Paste JSON response]
6. **Result:** ✅ PASS / ❌ FAIL

#### Step 4.2: Verify User A's Pond Still Exists
1. Logout User B
2. Login as User A
3. Navigate to "Pond Management"
4. **Expected Result:** "User A Pond 1" still exists
5. **Result:** ✅ PASS / ❌ FAIL

#### Step 4.3: Attempt to Modify Another User's Feed Log
1. Get User B's pond ID from Step 2.4: _______________
2. Login as User A
3. In Console, attempt to create feed log for User B's pond:
   ```javascript
   fetch('/api/feed-logs', {
     method: 'POST',
     headers: {
       'Authorization': 'Bearer ' + localStorage.getItem('manthena_aqua_jwt'),
       'Content-Type': 'application/json'
     },
     body: JSON.stringify({
       pondId: 'USER_B_POND_ID',
       date: new Date().toISOString().split('T')[0],
       slot: '07:00 AM',
       feedQtyKg: 5,
       remarks: 'Attempting unauthorized feed log'
     })
   }).then(r => r.json()).then(d => console.log('Feed Log Result:', d))
   ```
4. **Expected Result:**
   - HTTP Status: 403 or resource not found
   - Feed log NOT created
   - Only User A's ponds can receive feed logs
5. **Record Response:** [Paste JSON response]
6. **Result:** ✅ PASS / ❌ FAIL

#### Step 4.4: Verify User B's Feed Logs Unchanged
1. Logout User A
2. Login as User B
3. Navigate to "Pond Management" → "User B Pond 1"
4. Check feed logs
5. **Expected Result:** Only User B's original feed log from Step 2.5 is present
6. **Result:** ✅ PASS / ❌ FAIL

---

### Phase 5: Role-Based Access Control

#### Step 5.1: Admin Login
1. Login with admin credentials:
   - Username: admin
   - Password: admin@123
2. **Expected Result:**
   - "Admin Panel" tab appears in navigation
   - "Manage Users" tab is visible
   - Regular user tabs are also visible (Admin has full access)
3. **Result:** ✅ PASS / ❌ FAIL

#### Step 5.2: Verify Admin Can View All Users
1. Click "Admin Panel" tab
2. **Expected Result:**
   - "Manage Users" list shows all users
   - At minimum includes: test_user_a, test_user_b, admin
   - Shows User ID, Username, Email, Full Name, Role, Status, Last Login
3. **Record:** Number of users visible: _______________
4. **Result:** ✅ PASS / ❌ FAIL

#### Step 5.3: Admin Search Users
1. In Admin Panel, search for "test_user_a"
2. **Expected Result:**
   - User A's record appears
   - Shows User ID, email, role, status
3. **Result:** ✅ PASS / ❌ FAIL

#### Step 5.4: Admin Change User Role
1. In Admin Panel, find test_user_a
2. Click "Manage" button
3. Change role from "Servant" to "Supervisor"
4. Click "Save Changes"
5. **Expected Result:**
   - Role updated successfully
   - Confirmation message appears
6. **Result:** ✅ PASS / ❌ FAIL

#### Step 5.5: Admin Deactivate User
1. In Admin Panel, find test_user_b
2. Click "Manage" button
3. Change Status from "Active" to "Inactive"
4. Click "Save Changes"
5. **Expected Result:**
   - Status updated to Inactive
   - Confirmation message appears
6. **Result:** ✅ PASS / ❌ FAIL

#### Step 5.6: Verify Deactivated User Cannot Login
1. Logout admin
2. Attempt to login as test_user_b (who was deactivated)
3. **Expected Result:**
   - Login fails
   - Message: "This account is currently inactive or suspended"
   - Dashboard is NOT accessible
4. **Result:** ✅ PASS / ❌ FAIL

#### Step 5.7: Servant User Cannot Access Admin Panel
1. Login as a servant user (e.g., ramu / servant123)
2. Navigate to dashboard
3. **Expected Result:**
   - "Admin Panel" tab is NOT visible
   - No admin controls are accessible
   - Only servant-level features are visible
4. **Result:** ✅ PASS / ❌ FAIL

---

## Summary Results

### Phase 1: Account Creation
- Step 1.1 - User A Creation: ✅ PASS / ❌ FAIL
- Step 1.2 - User B Creation: ✅ PASS / ❌ FAIL

### Phase 2: Data Creation
- Step 2.1 - User A Pond: ✅ PASS / ❌ FAIL
- Step 2.2 - User A Feed Log: ✅ PASS / ❌ FAIL
- Step 2.3 - User A Water Log: ✅ PASS / ❌ FAIL
- Step 2.4 - User B Pond: ✅ PASS / ❌ FAIL
- Step 2.5 - User B Feed Log: ✅ PASS / ❌ FAIL

### Phase 3: Data Isolation Verification
- Step 3.1 - User B Dashboard Isolation: ✅ PASS / ❌ FAIL
- Step 3.2 - User A Dashboard Isolation: ✅ PASS / ❌ FAIL
- Step 3.3 - API Token Test: ✅ PASS / ❌ FAIL
- Step 3.4 - API Pond Query Isolation: ✅ PASS / ❌ FAIL
- Step 3.5 - Backend Authorization: ✅ PASS / ❌ FAIL

### Phase 4: Unauthorized Access Attempt
- Step 4.1 - Pond Deletion Block: ✅ PASS / ❌ FAIL
- Step 4.2 - Pond Existence Verified: ✅ PASS / ❌ FAIL
- Step 4.3 - Feed Log Authorization: ✅ PASS / ❌ FAIL
- Step 4.4 - Feed Log Unchanged: ✅ PASS / ❌ FAIL

### Phase 5: Role-Based Access Control
- Step 5.1 - Admin Login: ✅ PASS / ❌ FAIL
- Step 5.2 - Admin View All Users: ✅ PASS / ❌ FAIL
- Step 5.3 - Admin Search: ✅ PASS / ❌ FAIL
- Step 5.4 - Admin Change Role: ✅ PASS / ❌ FAIL
- Step 5.5 - Admin Deactivate: ✅ PASS / ❌ FAIL
- Step 5.6 - Deactivated User Login Block: ✅ PASS / ❌ FAIL
- Step 5.7 - Servant No Admin Access: ✅ PASS / ❌ FAIL

---

## Overall Results

**Total Tests:** 29  
**Passed:** _____  
**Failed:** _____  
**Success Rate:** _____%  

**Status:** 
- ✅ ALL TESTS PASSED - System is secure and multi-user ready
- ⚠️ SOME TESTS FAILED - See failed items above for security review
- ❌ CRITICAL FAILURES - System needs fixes before production

---

## Notes

- Ensure browser cache is cleared between user sessions if tests show unexpected results
- All timestamps should be in UTC or user's local timezone (verify in logs)
- Check server console for any authorization errors or warnings
- Verify database connections are stable during testing
- Use incognito/private mode if local session persistence causes issues

---

## Sign-off

**Tested By:** _______________________  
**Date:** _______________________  
**Approved For Production:** ✅ YES / ❌ NO  

