/**
 * Therefore Form.io Library — Usage Examples
 *
 * This file demonstrates how to use window.Therefore inside a Form.io
 * custom action (Logic / Custom Action / Event handler).
 *
 * In Form.io custom actions the script runs in a browser context where
 * window.Therefore has already been loaded via formio.js.
 *
 * Destructure the classes you need at the top of your custom action:
 *
 *   const { ThereforeClient, IndexData, SaveDocumentIndexDataQuickParams,
 *           QueryDefinition, Condition, getConfigurationFromLocalStorage } = window.Therefore;
 */


// ============================================================
// SETUP — used in every example below
// ============================================================

/**
 * getClient() — build a ThereforeClient from the token/URL already stored
 * in the browser by the Therefore web portal.
 * Call this at the top of any custom action.
 */
function getClient() {
    const { ThereforeClient, getConfigurationFromLocalStorage } = window.Therefore;
    const config = getConfigurationFromLocalStorage();
    if (!config || !config.apiUrl) throw new Error('Therefore configuration not found in localStorage.');
    return new ThereforeClient({ baseUrl: config.apiUrl, token: config.token, tenant: config.tenant });
}

/**
 * Alternatively, authenticate with explicit credentials (Basic Auth).
 * Useful for testing or server-side contexts.
 */
async function exampleBasicAuthClient() {
    const { ThereforeClient } = window.Therefore;
    const client = new ThereforeClient({
        baseUrl: 'https://yourtenant.thereforeonline.com/theservice/v0001/restun',
        username: 'your.username',
        password: 'your.password',
        tenant: 'yourtenant'
    });
    return client;
}


// ============================================================
// INDEX DATA — SaveDocumentIndexDataQuick
// ============================================================

/**
 * Update index fields on an existing document without requiring
 * a LastChangeTime check (the "Quick" variant).
 *
 * Use the IndexData builder to set only the fields you want to change —
 * unspecified fields are left unchanged by the API.
 */
async function exampleSaveIndexDataQuick(docNo) {
    const { IndexData, SaveDocumentIndexDataQuickParams } = window.Therefore;
    const client = getClient();

    const indexData = new IndexData()
        .addString('Invoice_No', 'INV-2024-001')      // string field by name  → FieldNo:0, FieldName:'Invoice_No'
        .addString(101, 'INV-2024-001')                // string field by FieldNo → FieldNo:101
        .addInt('Page_Count', 12)                      // integer field
        .addMoney('Amount', 1500.00)                   // currency field
        .addDate('Invoice_Date', '2024-03-15')         // date — sent as DataISO8601Value
        .addDate('Due_Date', new Date())               // date as Date object
        .addDateTime('Processed_At', new Date())       // datetime — sent as DataISO8601Value
        .addLogical('Is_Approved', true)               // boolean
        .addKeyword('Status', 'Approved')              // by display name → FieldName auto-becomes 'Status_Text'
        .addKeywordByNo('Status', 42)                   // by numeric KeywordNo → FieldName stays 'Status'
        .addMultiKeyword('Tags', ['Urgent', 'Finance']) // multi-keyword by display names
        .addMultiKeyword('Tags', [10, 11])              // multi-keyword by KeywordNos
        .addMultiKeyword('Tags', ['Urgent', 10]);       // mix of names and numbers

    const params = new SaveDocumentIndexDataQuickParams(docNo, indexData);
    await client.execute('SaveDocumentIndexDataQuick', params);
}


// ============================================================
// INDEX DATA — Read with getDocumentIndexData
// ============================================================

/**
 * Read all typed index fields from a document using the dedicated endpoint.
 * Returns full typed data including LastChangeTime (needed for updateDocument2).
 * Use getFieldValue() for quick scalar access, getField() for the full typed item.
 */
async function exampleGetDocumentIndexData(docNo) {
    const client = getClient();

    const doc = await client.getDocumentIndexData(docNo);

    // Quick scalar read — returns DataValue directly
    const invoiceNo  = doc.getFieldValue('Invoice_No');   // "INV-2024-001"
    const amount     = doc.getFieldValue('Amount');        // 1500.00
    const isApproved = doc.getFieldValue('Is_Approved');  // true

    // Full typed item — includes FieldNo, FieldName, KeywordNo etc.
    const statusItem = doc.getField('Status');             // { FieldNo, FieldName, KeywordNo, DataValue }
    const keywordNo  = statusItem?.KeywordNo;

    // LastChangeTime is on IndexData — needed for updateDocument2
    const lastChangeTimeISO   = doc.IndexData.LastChangeTimeISO8601;

    console.log('Invoice:', invoiceNo, 'Amount:', amount, 'Approved:', isApproved);
    console.log('Status KeywordNo:', keywordNo);
    console.log('LastChangeTime:', lastChangeTimeISO);

    return doc;
}


// ============================================================
// INDEX DATA — Safe update with updateDocument2
// ============================================================

/**
 * Update index fields with concurrency protection (LastChangeTime check).
 * Use this instead of SaveDocumentIndexDataQuick when concurrent edits are possible.
 *
 * client.updateDocument2() auto-fetches LastChangeTime with an extra API call.
 * Pass it explicitly (from a prior getDocumentIndexData call) to avoid the extra round-trip.
 */
async function exampleUpdateDocument2(docNo) {
    const { IndexData } = window.Therefore;
    const client = getClient();

    // Auto-fetch LastChangeTime (one extra GetDocumentIndexData call internally):
    await client.updateDocument2(
        docNo,
        new IndexData()
            .addString('Status_Notes', 'Reviewed by finance team')
            .addLogical('Is_Approved', true)
            .addKeyword('Status', 'Approved')
            .IndexDataItems
    );

    // --- OR pass LastChangeTime explicitly to avoid the extra round-trip ---
    const current = await client.getDocumentIndexData(docNo);
    const invoiceNo = current.getFieldValue('Invoice_No');  // read while we have it

    await client.updateDocument2(
        docNo,
        new IndexData().addString('Invoice_No', invoiceNo + '-REV').IndexDataItems,
        {
            lastChangeTime:    current.IndexData.LastChangeTime,
            lastChangeTimeISO8601: current.IndexData.LastChangeTimeISO8601,
            checkInComments:   'Revision suffix added'
        }
    );
}


// ============================================================
// KEYWORDS — resolve display name to KeywordNo
// ============================================================

/**
 * Look up a keyword number by its display label before writing to a keyword field.
 * Required when you have a string value (e.g. from a form dropdown) but the API
 * needs the numeric KeywordNo.
 */
async function exampleKeywordLookup(categoryNo, fieldNo, displayValue) {
    const client = getClient();

    const kws = await client.getKeywordsByFieldNo(fieldNo, categoryNo);
    console.log('All keywords:', kws.Keywords); // [{ KeywordNo, KeywordName }]

    const keywordNo = kws.findKeywordNo(displayValue); // case-insensitive
    if (keywordNo === null) throw new Error('Unknown keyword: ' + displayValue);

    console.log(displayValue, '→ KeywordNo', keywordNo);
    return keywordNo;
}

/**
 * Practical pattern: save a keyword from a Form.io select field string value.
 *
 * addKeyword() accepts a display name string (FieldName gets '_Text' suffix automatically).
 * addKeywordByNo() accepts a numeric KeywordNo (no suffix — use when you already have the ID).
 * Use getKeywordsByFieldNo to resolve a display name to a KeywordNo when needed.
 */
async function exampleSaveWithResolvedKeyword(docNo, categoryNo, statusFieldNo) {
    const { IndexData } = window.Therefore;
    const client = getClient();

    // Quick save — pass the display name string directly:
    await client.execute('SaveDocumentIndexDataQuick',
        new (window.Therefore.SaveDocumentIndexDataQuickParams)(
            docNo,
            new IndexData().addKeyword('Status', data.statusDropdown) // e.g. 'Approved'
        )
    );

    // --- UpdateDocument2: resolve to numeric KeywordNo first, then use addKeywordByNo ---
    const kws = await client.getKeywordsByFieldNo(statusFieldNo, categoryNo);
    const keywordNo = kws.findKeywordNo(data.statusDropdown);
    if (keywordNo === null) throw new Error('Invalid status: ' + data.statusDropdown);

    await client.updateDocument2(docNo,
        new IndexData().addKeywordByNo('Status', keywordNo).IndexDataItems
    );
}


// ============================================================
// STREAMS — add files to existing documents
// ============================================================

/**
 * Attach one or more files to an existing document.
 * StreamNo 0 = replace/set primary stream. StreamNo 1+ = additional attachments.
 * NewStreamInsertMode 0 = insert as new stream.
 */
async function exampleAddStreamsToDocument(docNo, fileInput) {
    const { fileToBase64 } = window.Therefore;
    const client = getClient();

    // Single file
    const file = fileInput.files[0];
    const base64 = await fileToBase64(file);

    await client.addStreamsToDocument(docNo, [
        {
            StreamNo: 1,                   // 1 = first additional attachment (0 = primary)
            FileName: file.name,
            FileDataBase64JSON: base64,
            NewStreamInsertMode: 0
        }
    ]);

    console.log('Stream added to DocNo:', docNo);
}

/**
 * Attach multiple files at once.
 */
async function exampleAddMultipleStreams(docNo, fileInput) {
    const { fileToBase64 } = window.Therefore;
    const client = getClient();

    const streams = await Promise.all(
        Array.from(fileInput.files).map(async (file, i) => ({
            StreamNo: i + 1,
            FileName: file.name,
            FileDataBase64JSON: await fileToBase64(file),
            NewStreamInsertMode: 0
        }))
    );

    await client.addStreamsToDocument(docNo, streams);
    console.log('Added', streams.length, 'streams to DocNo:', docNo);
}


// ============================================================
// QUERIES — async (preferred for production)
// ============================================================

/**
 * executeAsyncSingleQuery fetches ALL pages automatically and releases the server
 * query resource when done. Use this instead of executeSingleQuery in production.
 */
async function exampleAsyncQuery(categoryNo, invoiceNo) {
    const { QueryDefinition, Condition } = window.Therefore;
    const client = getClient();

    const query = new QueryDefinition({
        categoryNo,
        conditions: [new Condition('Invoice_No', invoiceNo)],
        selectedFields: ['Invoice_No', 'Amount', 'Status'],
        orderByFields: ['Invoice_No']
    });

    // maxRows = 0 → return all rows (pages through automatically)
    const result = await client.executeAsyncSingleQuery({ Query: query });
    console.log('Total rows returned:', result.TotalRows);

    // Map columns to values — always use the Columns array, never assume position
    const columns = result.QueryResult.Columns;
    for (const row of result.QueryResult.ResultRows) {
        const fields = {};
        columns.forEach((col, i) => { fields[col.ColName || col.Caption] = row.IndexValues[i]; });
        console.log('DocNo:', row.DocNo, fields);
    }

    return result;
}

/**
 * Fetch only the first N rows — useful for populating a dropdown or preview table.
 */
async function exampleAsyncQueryWithLimit(categoryNo) {
    const { QueryDefinition } = window.Therefore;
    const client = getClient();

    const query = new QueryDefinition({ categoryNo, orderByFields: ['Invoice_Date'] });

    // maxRows = 50 → stop after 50 rows even if more exist on the server
    const result = await client.executeAsyncSingleQuery({ Query: query }, 50);
    console.log('Rows (capped at 50):', result.TotalRows);
    return result;
}


// ============================================================
// DOCUMENTS
// ============================================================

/**
 * Create a document in a category, with index data and an attached file.
 */
async function exampleCreateDocument(categoryNo, fileInput) {
    const { fileToBase64, CreateDocumentParams } = window.Therefore;
    const client = getClient();

    // Convert the selected file to base64
    const file = fileInput.files[0];
    const base64 = await fileToBase64(file);

    const params = new CreateDocumentParams(
        categoryNo,
        {
            IndexDataItems: [
                { StringIndexData: { FieldName: 'Invoice_No', DataValue: 'INV-2024-001' } },
                { MoneyIndexData:  { FieldName: 'Amount',     DataValue: 1500.00 } }
            ]
        },
        [
            {
                StreamNo: 0,
                FileName: file.name,
                FileDataBase64JSON: base64,
                NewStreamInsertMode: 0
            }
        ]
    );

    const response = await client.createDocument(params);
    console.log('Created DocNo:', response.DocNo);
    return response.DocNo;
}

/**
 * Get document metadata and index field values.
 */
async function exampleGetDocument(docNo) {
    const { GetDocumentParams } = window.Therefore;
    const client = getClient();

    const params = new GetDocumentParams({
        DocNo: docNo,
        IsIndexDataValuesNeeded: true,
        IsStreamsInfoAndDataNeeded: false,  // skip file content for speed
        IsStreamsInfoNeeded: true,
        IsCheckOutStatusNeeded: true
    });

    const doc = await client.getDocument(params);
    console.log('DocNo:', doc.DocNo);
    console.log('CheckOutStatus:', doc.CheckOutStatus);

    // Index items are typed — check for the type key on each item
    const items = doc.IndexData?.IndexDataItems || [];
    for (const item of items) {
        if (item.StringIndexData)  console.log(item.StringIndexData.FieldName, '=', item.StringIndexData.DataValue);
        if (item.IntIndexData)     console.log(item.IntIndexData.FieldName, '=', item.IntIndexData.DataValue);
        if (item.MoneyIndexData)   console.log(item.MoneyIndexData.FieldName, '=', item.MoneyIndexData.DataValue);
        if (item.DateIndexData)    console.log(item.DateIndexData.FieldName, '=', item.DateIndexData.DataValue);
        if (item.LogicalIndexData) console.log(item.LogicalIndexData.FieldName, '=', item.LogicalIndexData.DataValue);
        if (item.SingleKeywordData) console.log(item.SingleKeywordData.FieldName, '=', item.SingleKeywordData.DataValue);
    }

    return doc;
}

/**
 * Check out, modify, then check in a document.
 */
async function exampleCheckOutAndIn(docNo) {
    const { IndexData, SaveDocumentIndexDataQuickParams } = window.Therefore;
    const client = getClient();

    await client.checkOutDocument(docNo);

    const indexData = new IndexData().addString('Notes', 'Updated via Form.io');
    await client.execute('SaveDocumentIndexDataQuick', new SaveDocumentIndexDataQuickParams(docNo, indexData));

    await client.checkInDocument(docNo, 'Updated notes field');
}

/**
 * Download a document stream (file) and open it in a new tab.
 */
async function exampleGetDocumentStream(docNo, streamNo = 0) {
    const { GetDocumentStreamParams } = window.Therefore;
    const client = getClient();

    const params = new GetDocumentStreamParams(docNo, streamNo);
    const response = await client.execute('GetDocumentStream', params);

    // response.StreamData is base64 — decode and open as blob URL
    const binary = atob(response.StreamData);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const blob = new Blob([bytes], { type: response.ContentType || 'application/octet-stream' });
    window.open(URL.createObjectURL(blob), '_blank');
}

/**
 * Get a reference number from a dedicated auto-numbering category.
 */
async function exampleGetReferenceNumber() {
    const client = getClient();
    const refNo = await client.getReferenceNumber('Invoice Reference Numbers');
    console.log('New reference number:', refNo);
    return refNo;
}


// ============================================================
// QUERIES
// ============================================================

/**
 * Search for documents using a simple field condition.
 */
async function exampleSimpleQuery(categoryNo, invoiceNo) {
    const { QueryDefinition, Condition, QueryResult } = window.Therefore;
    const client = getClient();

    const query = new QueryDefinition({
        categoryNo: categoryNo,
        conditions: [
            new Condition('Invoice_No', invoiceNo),          // exact match — bare value, no "=" prefix
            new Condition('Amount', '>= 1000'),              // comparison
            new Condition('Invoice_Date', '>= 2024-01-01', 'UTC') // date with timezone
        ],
        selectedFields: ['Invoice_No', 'Amount', 'Invoice_Date'],
        orderByFields: ['Invoice_Date'],
        maxRows: 100
    });

    const raw = await client.executeSingleQuery({ Query: query });
    const result = new QueryResult(raw);

    // Columns and IndexValues are parallel arrays
    const columns = raw.QueryResult?.Columns || [];
    for (const row of result.ResultRows) {
        const fields = {};
        columns.forEach((col, i) => { fields[col.ColName || col.Caption] = row.IndexValues[i]; });
        console.log('DocNo:', row.DocNo, fields);
    }

    return result;
}

/**
 * Find all documents where a field is null.
 */
async function exampleQueryNullField(categoryNo) {
    const { QueryDefinition, Condition } = window.Therefore;
    const client = getClient();

    const query = new QueryDefinition({
        categoryNo,
        conditions: [new Condition('Approved_By', 'IS NULL')]
    });

    return client.executeSingleQuery({ Query: query });
}

/**
 * Look up a category number by name, then query it.
 */
async function exampleQueryByCategory(categoryName) {
    const client = getClient();
    const categoryNo = await client.getCategoryNoFromName(categoryName);
    if (!categoryNo) throw new Error('Category not found: ' + categoryName);

    const { QueryDefinition, Condition } = window.Therefore;
    const query = new QueryDefinition({
        categoryNo,
        conditions: [new Condition('Status', 'Pending')]
    });

    return client.executeSingleQuery({ Query: query });
}


// ============================================================
// CASES
// ============================================================

/**
 * Create a new case with index data.
 */
async function exampleCreateCase(categoryNo) {
    const { CreateCaseParams } = window.Therefore;
    const client = getClient();

    const params = new CreateCaseParams(
        { CategoryNo: categoryNo },
        {
            IndexDataItems: [
                { StringIndexData: { FieldName: 'Case_Title', DataValue: 'New Support Case' } },
                { IntIndexData:    { FieldName: 'Priority',   DataValue: 1 } }
            ]
        }
    );

    const response = await client.createCase(params);
    console.log('Created CaseNo:', response.CaseNo);
    return response.CaseNo;
}

/**
 * Get, close, and delete a case.
 */
async function exampleCaseLifecycle(caseNo) {
    const client = getClient();

    const caseData = await client.getCase(caseNo);
    console.log('Case:', caseData);

    await client.closeCase(caseNo);
    // await client.deleteCase(caseNo); // uncomment to also delete
}


// ============================================================
// WORKFLOW
// ============================================================

/**
 * Start a workflow on a document, then claim and complete the first task.
 */
async function exampleWorkflow(docNo, processNo) {
    const { StartWorkflowInstanceParams, ClaimWorkflowInstanceParams,
            FinishCurrentWorkflowTaskParams } = window.Therefore;
    const client = getClient();

    const startResponse = await client.startWorkflowInstance(docNo, processNo);
    const instanceNo = startResponse.InstanceNo;

    // Get the instance to find the current node
    const { GetWorkflowInstanceParams } = window.Therefore;
    const instance = await client.execute('GetWorkflowInstance', new GetWorkflowInstanceParams(instanceNo));
    const nodeNo = instance.WorkflowInstance?.CurrentNodeNo;

    await client.claimWorkflowInstance(instanceNo);
    await client.finishCurrentWorkflowTask(instanceNo, nodeNo, null);
    console.log('Workflow task completed for instance:', instanceNo);
}

/**
 * Get workflow history for a document instance.
 */
async function exampleWorkflowHistory(instanceNo) {
    const { GetWorkflowHistoryParams } = window.Therefore;
    const client = getClient();

    const response = await client.execute('GetWorkflowHistory', new GetWorkflowHistoryParams(instanceNo));
    console.log('History entries:', response.History.length);
    return response.History;
}


// ============================================================
// COMMENTS
// ============================================================

/**
 * Add a comment to a document and then retrieve all comments.
 */
async function exampleComments(docNo) {
    const { AddCommentParams } = window.Therefore;
    const client = getClient();

    await client.addComment(docNo, 'Reviewed and approved.');
    const response = await client.getComments(docNo);
    console.log('Comments:', response);
}


// ============================================================
// USERS & ADMIN
// ============================================================

/**
 * Get the currently authenticated user.
 */
async function exampleGetConnectedUser() {
    const client = getClient();
    const user = await client.getConnectedUser();
    console.log('Connected user:', user);
    return user;
}

/**
 * Search for users by name.
 */
async function exampleFindUser(namePart) {
    const { ExecuteUsersQueryParams, ExecuteUsersQueryResponse } = window.Therefore;
    const client = getClient();

    const params = new ExecuteUsersQueryParams({
        Conditions: [{ FieldNoOrName: 'Name', Condition: 'LIKE ' + namePart + '%' }]
    });

    const raw = await client.execute('ExecuteUsersQuery', params);
    const response = new ExecuteUsersQueryResponse(raw);
    console.log('Users found:', response.Users.length);
    return response.Users;
}

/**
 * Get the full category tree and log top-level items.
 */
async function exampleGetCategoriesTree() {
    const { GetCategoriesTreeResponse } = window.Therefore;
    const client = getClient();

    const raw = await client.execute('GetCategoriesTree', {});
    const response = new GetCategoriesTreeResponse(raw);
    console.log('Top-level items:', response.Tree);
    return response;
}

/**
 * Get field definitions for a category — useful for discovering FieldNo values
 * or checking which fields are mandatory.
 */
async function exampleGetCategoryInfo(categoryNo) {
    const client = getClient();

    const info = await client.getCategoryInfo(categoryNo);
    console.log('Category name:', info.CategoryInfo?.Name);

    const fields = info.CategoryInfo?.CategoryFields || [];
    for (const f of fields) {
        console.log('  FieldNo=' + f.FieldNo + ' Name=' + f.Caption + ' Type=' + f.FieldType + ' Mandatory=' + f.IsMandatory);
    }

    return info;
}


// ============================================================
// REFERENCED TABLES
// ============================================================

/**
 * Query all rows from a referenced table by name.
 * Returns { dataTypeNo, categoryNo, name, columns, rowCount, rows }.
 * rows[i].IndexValues maps positionally to columns[i].ColName.
 */
async function exampleQueryReferencedTable() {
    const client = getClient();

    const result = await client.queryReferencedTable(
        'Your_Referenced_Table_Name',
        [{ FieldNoOrName: 'FieldName', Condition: '*' }]
    );

    console.log(`${result.rowCount} rows from '${result.name}' (categoryNo=${result.categoryNo})`);
    console.log('Columns:', result.columns.map(c => c.ColumnName));

    // Map to named objects using column positions:
    const colNames = result.columns.map(c => c.ColumnName);
    const objects = result.rows.map(row => {
        const obj = { docNo: row.DocNo };
        colNames.forEach((name, i) => { obj[name] = row.IndexValues[i]; });
        return obj;
    });
    console.log('First row:', objects[0]);

    return result;
}

/**
 * Populate a Form.io Select component with rows from a referenced table.
 * Call from a Custom Action on form load.
 *
 * IndexValues: [0]=Category, [1]=Code, [2]=DisplayName (column order from the table)
 */
async function examplePopulateSelectFromReferencedTable() {
    const client = getClient();

    const result = await client.queryReferencedTable(
        'Your_Referenced_Table_Name',
        [{ FieldNoOrName: 'FieldName', Condition: '*' }]
    );

    const selectItems = result.rows.map(row => ({
        label: row.IndexValues[2] + ' (' + row.IndexValues[0] + ')',
        value: row.IndexValues[1],
        category:    row.IndexValues[0],
        displayName: row.IndexValues[2],
        docNo:       row.DocNo,
    }));

    // Set items on a Form.io Select component:
    const selectComponent = utils.getComponent(form.components, 'selectComponentKey');
    if (selectComponent) {
        selectComponent.setItems(selectItems);
    }

    return selectItems;
}


// ============================================================
// FORM.IO HELPERS
// ============================================================

/**
 * Force a Form.io component to re-render after data changes.
 * Call this after updating data that a component's conditional logic depends on.
 */
function exampleRedrawComponent() {
    const { redrawComponent } = window.Therefore;
    redrawComponent('myDataGridComponent');
    redrawComponent('mySelectField');
}

/**
 * Typical Form.io custom action pattern — wrap everything in try/catch
 * so errors surface as form validation messages rather than silent failures.
 */
async function exampleFormioCustomAction() {
    const { IndexData, SaveDocumentIndexDataQuickParams } = window.Therefore;

    try {
        const client = getClient();
        const docNo = data.thereforeDocNo; // value from a form field

        const indexData = new IndexData()
            .addString('Submitter_Name', data.fullName)
            .addString('Email', data.email)
            .addDate('Submission_Date', new Date())
            .addLogical('Terms_Accepted', data.termsAccepted);

        await client.execute('SaveDocumentIndexDataQuick',
            new SaveDocumentIndexDataQuickParams(docNo, indexData));

        // Trigger a form component to update its display
        const { redrawComponent } = window.Therefore;
        redrawComponent('statusLabel');

    } catch (err) {
        console.error('Therefore save failed:', err);
        // Surface to user via Form.io's setAlert or similar
        instance.setAlert('danger', 'Failed to save to Therefore: ' + err.message);
    }
}
