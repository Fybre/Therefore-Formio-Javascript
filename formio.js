/**
   * Therefore Form.io Library
   * 
   * This file combines the Therefore Client and Types into a single script 
   * suitable for inclusion in Form.io forms or other browser environments 
   * where ES6 modules are not easily used.
   * 
   * It registers the classes under "window.Therefore".
   */
  
  // ==========================================
  // PART 1: Types (from therefore-types.js)
  // ==========================================
  
  /**
   * Parameter class for GetJWTToken operation.
   */
  class GetJWTTokenParams {
      /**
       * @param {string} username 
       * @param {string} password 
       * @param {string} [domain=''] 
       */
      constructor(username, password, domain = '') {
          this.Username = username;
          this.Password = password;
          this.Domain = domain;
      }
  }
  
  /**
   * Parameter class for CreateCase operation.
   */
  class CreateCaseParams {
      /**
       * @param {object} caseDefinition - Case definition (or use separate class).
       * @param {object} indexData - Key-value pairs of index data.
       */
      constructor(caseDefinition, indexData) {
          this.CaseDef = caseDefinition; 
          this.IndexData = indexData;
      }
  }
  
  /**
   * Parameter class for GetCase operation.
   */
  class GetCaseParams {
      /**
       * @param {number} caseNo 
       */
      constructor(caseNo) {
          this.CaseNo = caseNo;
      }
  }
  
  /**
   * Parameter class for ExecuteSingleQuery operation.
   */
  class ExecuteSingleQueryParams {
      /**
       * @param {object} query - The query definition.
       */
      constructor(query) {
          this.Query = query;
      }
  }
  
  /**
   * Parameter class for CreateDocument operation.
   */
  class CreateDocumentParams {
      /**
       * @param {number} categoryNo 
       * @param {object} indexData 
       * @param {Array<object>} streams - File streams/content.
       */
      constructor(categoryNo, indexData, streams = []) {
          this.CategoryNo = categoryNo;
          this.IndexData = indexData;
          this.Streams = streams;
      }
  }
  
  /**
   * Parameter class for GetDocument operation.
   */
  class GetDocumentParams {
      /**
       * @param {object} params
       * @param {number} params.DocNo 
       * @param {boolean} [params.IsLink=false] 
       * @param {boolean} [params.IsCheckOutStatusNeeded=true]
       * @param {boolean} [params.IsIndexDataValuesNeeded=true]
       * @param {boolean} [params.IsStreamsInfoAndDataNeeded=true]
       * @param {boolean} [params.IsStreamsInfoNeeded=true]
       * @param {number} [params.VersionNo=0]
       * @param {boolean} [params.IsAccessMaskNeeded=true]
       * @param {boolean} [params.TitleHideCategory=false]
       * @param {boolean} [params.IsStreamDataBase64JSONNeeded=true]
       * @param {number} [params.TitleType=0]
       * @param {string} [params.RetrieveReason='']
       */
      constructor({ 
          DocNo, 
          IsLink = false, 
          IsCheckOutStatusNeeded = true, 
          IsIndexDataValuesNeeded = true, 
          IsStreamsInfoAndDataNeeded = true, 
          IsStreamsInfoNeeded = true, 
          VersionNo = 0, 
          IsAccessMaskNeeded = true, 
          TitleHideCategory = false, 
          IsStreamDataBase64JSONNeeded = true, 
          TitleType = 0, 
          RetrieveReason = '' 
      } = {}) {
          this.DocNo = DocNo;
          this.IsLink = IsLink;
          this.IsCheckOutStatusNeeded = IsCheckOutStatusNeeded;
          this.IsIndexDataValuesNeeded = IsIndexDataValuesNeeded;
          this.IsStreamsInfoAndDataNeeded = IsStreamsInfoAndDataNeeded;
          this.IsStreamsInfoNeeded = IsStreamsInfoNeeded;
          this.VersionNo = VersionNo;
          this.IsAccessMaskNeeded = IsAccessMaskNeeded;
          this.TitleHideCategory = TitleHideCategory;
          this.IsStreamDataBase64JSONNeeded = IsStreamDataBase64JSONNeeded;
          this.TitleType = TitleType;
          this.RetrieveReason = RetrieveReason;
      }
  }
  
  /**
   * Parameter class for CheckOutDocument operation.
   */
  class CheckOutDocumentParams {
      constructor(docNo) {
          this.DocNo = docNo;
      }
  }
  
  /**
   * Parameter class for CheckInDocument operation.
   */
  class CheckInDocumentParams {
      constructor(docNo, comment = '') {
          this.DocNo = docNo;
          this.Comment = comment;
      }
  }
  /**
   * Parameter class for DeleteDocument operation.
   */
  class DeleteDocumentParams {
      constructor(docNo) {
          this.DocNo = docNo;
      }
  }
  
  /**
   * Parameter class for SaveDocumentIndexData operation.
   */
  class SaveDocumentIndexDataParams {
      constructor(docNo, indexData) {
          this.DocNo = docNo;
          this.IndexData = indexData;
      }
  }

  /**
   * Typed index data builder for Therefore document fields.
   *
   * Build up IndexDataItems using the fluent add* methods, then pass the
   * instance as the indexData argument to SaveDocumentIndexDataQuickParams.
   *
   * Each add* method accepts either a numeric FieldNo or a string FieldName.
   *
   * Example:
   *   const idx = new IndexData()
   *     .addString('Invoice_No', 'INV-2024-001')
   *     .addMoney('Amount', 1500.00)
   *     .addKeyword('Status', 'Approved'); // auto-appends _Text → FieldName: 'Status_Text'
   *   const params = new SaveDocumentIndexDataQuickParams(docNo, idx);
   */
  class IndexData {
      constructor() {
          this.IndexDataItems = [];
      }

      /**
       * Returns { FieldNo, FieldName? } for the given field reference.
       * Number  → { FieldNo: n }          — API looks up by number
       * String  → { FieldNo: 0, FieldName: s } — FieldNo 0 signals API to use FieldName
       */
      _fieldRef(fieldNoOrName) {
          if (typeof fieldNoOrName === 'number') {
              return { FieldNo: fieldNoOrName };
          }
          return { FieldNo: 0, FieldName: fieldNoOrName };
      }

      /** Adds a string field. */
      addString(fieldNoOrName, value) {
          this.IndexDataItems.push({ StringIndexData: { ...this._fieldRef(fieldNoOrName), DataValue: value } });
          return this;
      }

      /** Adds an integer field. */
      addInt(fieldNoOrName, value) {
          this.IndexDataItems.push({ IntIndexData: { ...this._fieldRef(fieldNoOrName), DataValue: value } });
          return this;
      }

      /** Adds a money/currency field. */
      addMoney(fieldNoOrName, value) {
          this.IndexDataItems.push({ MoneyIndexData: { ...this._fieldRef(fieldNoOrName), DataValue: value } });
          return this;
      }

      /**
       * Adds a date field.
       * @param {string|Date} value - ISO 8601 string (e.g. "2024-01-15") or Date object.
       *   Sent as DataISO8601Value which the API prefers over the WCF date format.
       */
      addDate(fieldNoOrName, value) {
          const iso = value instanceof Date ? value.toISOString().split('T')[0] : value;
          this.IndexDataItems.push({ DateIndexData: { ...this._fieldRef(fieldNoOrName), DataISO8601Value: iso } });
          return this;
      }

      /**
       * Adds a datetime field.
       * @param {string|Date} value - ISO 8601 string or Date object.
       */
      addDateTime(fieldNoOrName, value) {
          const iso = value instanceof Date ? value.toISOString() : value;
          this.IndexDataItems.push({ DateTimeIndexData: { ...this._fieldRef(fieldNoOrName), DataISO8601Value: iso } });
          return this;
      }

      /** Adds a boolean/logical field. */
      addLogical(fieldNoOrName, value) {
          this.IndexDataItems.push({ LogicalIndexData: { ...this._fieldRef(fieldNoOrName), DataValue: value } });
          return this;
      }

      /**
       * Adds a single-select keyword field by display name.
       * When using a string field name, the API requires a "_Text" suffix on the FieldName
       * to indicate the DataValue is a display name (e.g. 'Status_Text'). This is appended
       * automatically. When using a numeric FieldNo, DataValue is sent as-is.
       * @param {string} keywordName - The keyword display label (e.g. 'Approved').
       */
      addKeyword(fieldNoOrName, keywordName) {
          const ref = this._fieldRef(fieldNoOrName);
          if (ref.FieldNo === 0) ref.FieldName = ref.FieldName.endsWith('_Text') ? ref.FieldName : ref.FieldName + '_Text';
          this.IndexDataItems.push({ SingleKeywordData: { ...ref, DataValue: keywordName } });
          return this;
      }

      /**
       * Adds a single-select keyword field by numeric KeywordNo.
       * Uses the bare field name (no "_Text" suffix), with DataValue as a string of the KeywordNo.
       * @param {string|number} fieldNoOrName - Field number or field name (without _Text suffix).
       * @param {number} keywordNo - The numeric KeywordNo.
       */
      addKeywordByNo(fieldNoOrName, keywordNo) {
          this.IndexDataItems.push({ SingleKeywordData: { ...this._fieldRef(fieldNoOrName), DataValue: String(keywordNo) } });
          return this;
      }

      /**
       * Adds a multi-select keyword field.
       * Pass keyword display name strings, numeric KeywordNos, or mix both.
       * @param {Array<string|number>} keywords - Strings = keyword names; numbers = KeywordNos.
       */
      addMultiKeyword(fieldNoOrName, keywords) {
          const names = keywords.filter(k => typeof k === 'string');
          const nos   = keywords.filter(k => typeof k === 'number');
          const item  = { ...this._fieldRef(fieldNoOrName) };
          if (names.length > 0) item.DataValue  = names;
          if (nos.length   > 0) item.KeywordNos = nos;
          this.IndexDataItems.push({ MultipleKeywordData: item });
          return this;
      }
  }

  /**
   * Parameter class for SaveDocumentIndexDataQuick operation.
   * Pass an IndexData instance (or a plain object with IndexDataItems) as indexData.
   */
  class SaveDocumentIndexDataQuickParams {
      constructor(docNo, indexData) {
          this.DocNo = docNo;
          this.IndexData = indexData;
      }
  }
  
  /**
   * Parameter class for UpdateDocument operation.
   */
  class UpdateDocumentParams {
      constructor(docNo, indexData, streams) {
          this.DocNo = docNo;
          this.IndexData = indexData;
          this.Streams = streams;
      }
  }
  
  /**
   * Parameter class for GetDocumentStream operation.
   */
  class GetDocumentStreamParams {
      constructor(docNo, streamNo, versionNo = 0) {
          this.DocNo = docNo;
          this.StreamNo = streamNo;
          this.VersionNo = versionNo;
      }
  }
  
  // --- Response Types for Documents ---
  
  class CreateDocumentResponse {
      constructor(response) {
          this.DocNo = response.DocNo;
      }
  }
  
  class GetDocumentResponse {
      constructor(response) {
          this.DocNo = response.DocNo;
          this.CheckOutStatus = response.CheckOutStatus;
          this.IndexData = response.IndexData; // Object containing CategoryNo, IndexDataItems, etc.
          this.StreamsInfo = response.StreamsInfo;
          this.AccessMask = response.AccessMask;
          this.RoleAccessMask = response.RoleAccessMask;
      }
  }
  
  class GetDocumentStreamResponse {
      constructor(response) {
          this.FileName = response.FileName;
          this.StreamData = response.StreamData; // Base64 encoded possibly
          this.ContentType = response.ContentType;
      }
  }
  // --- Workflow Types ---
  
  /**
   * Parameter class for GetWorkflowHistory.
   */
  class GetWorkflowHistoryParams {
      constructor(instanceNo) {
          this.InstanceNo = instanceNo;
      }
  }
  
  /**
   * Parameter class for GetWorkflowInstance.
   */
  class GetWorkflowInstanceParams {
      constructor(instanceNo) {
          this.InstanceNo = instanceNo;
      }
  }
  
  /**
   * Parameter class for StartWorkflowInstance.
   */
  class StartWorkflowInstanceParams {
      constructor(docNo, processNo) {
          this.DocNo = docNo;
          this.ProcessNo = processNo;
      }
  }
  
  /**
   * Parameter class for ClaimWorkflowInstance.
   */
  class ClaimWorkflowInstanceParams {
      constructor(instanceNo, tokenNo) {
          this.InstanceNo = instanceNo;
          this.TokenNo = tokenNo;
      }
  }

  /**
   * Parameter class for FinishCurrentWorkflowTask.
   */
  class FinishCurrentWorkflowTaskParams {
      constructor(instanceNo, tokenNo, nextTaskNo, { textInformation = null, nextUsers = null } = {}) {
          this.InstanceNo = instanceNo;
          this.TokenNo = tokenNo;
          this.NextTaskNo = nextTaskNo;
          if (textInformation) this.TextInformation = textInformation;
          if (nextUsers)       this.NextUsers = nextUsers;
      }
  }

  // --- Comment Types ---

  /**
   * Parameter class for AddComment.
   * ObjType: 2 = document, 38 = case, 21 = workflow instance.
   */
  class AddCommentParams {
      constructor(objNo, text, objType = 2) {
          this.ObjNo = objNo;
          this.ObjType = objType;
          this.CommentText = text;
      }
  }
  
  // --- Admin/User Types ---
  
  /**
   * Parameter class for CreateUser.
   */
  class CreateUserParams {
      constructor(userParams) {
          this.UserParams = userParams; // Expects UserParams object structure
      }
  }
  
  /**
   * Parameter class for ExecuteUsersQuery.
   */
  class ExecuteUsersQueryParams {
      constructor(query) {
          this.Query = query;
      }
  }
  
  /**
   * Parameter class for GetCategoriesTree.
   */
  class GetCategoriesTreeParams {
      constructor() {
          // No params usually required for root tree
      }
  }
  
  /**
   * Parameter class for GetCategoryInfo.
   */
  class GetCategoryInfoParams {
      constructor(categoryNo) {
          this.CategoryNo = categoryNo;
      }
  }
  
  /**
   * Parameter class for GetUserDetails.
   */
  class GetUserDetailsParams {
      constructor(userNo) {
          this.UserNo = userNo;
      }
  }
  
  // --- Query Types ---
  
  /**
   * Parameter class for ExecuteMultiQuery.
   */
  class ExecuteMultiQueryParams {
      constructor(multiQuery) {
          this.MultiQuery = multiQuery;
      }
  }
  /**
   * Represents a single condition in a query.
   */
  class Condition {
      /**
       * @param {string|number} fieldNoOrName - The field number or name to filter on.
       * @param {string} condition - The condition string (e.g., ">= 100", "= 'Value'").
       * @param {string} [timeZone] - Optional timezone info.
       */
      constructor(fieldNoOrName, condition, timeZone = null) {
          this.FieldNoOrName = fieldNoOrName;
          this.Condition = condition;
          if (timeZone) this.TimeZone = timeZone;
      }
  }
  
  /**
   * Represents the definition of a query.
   */
  class QueryDefinition {
      /**
       * @param {object} params
       * @param {number} params.categoryNo - Category Number to search in.
       * @param {Array<Condition>} [params.conditions] - Array of Condition objects.
       * @param {Array<string|number>} [params.orderByFields] - Fields to order by.
       * @param {Array<string|number>} [params.selectedFields] - Fields to select (columns).
       * @param {number} [params.maxRows=0] - Max rows to return (0 = unlimited/server default).
       */
      constructor({ categoryNo, conditions = [], orderByFields = [], selectedFields = [], maxRows = 0 }) {
          this.CategoryNo = categoryNo;
          this.Conditions = conditions.map(c => ({
              FieldNoOrName: c.FieldNoOrName,
              Condition: c.Condition,
              TimeZone: c.TimeZone
          })); // Map to simple object structure expected by API if not using class directly
          
          // API expects simple lists of strings/numbers for these fields
          this.OrderByFieldsNoOrNames = orderByFields;
          this.SelectedFieldsNoOrNames = selectedFields;
          this.MaxRows = maxRows;
      }
  }
  
  // --- Response Wrapping Types ---
  
  /**
   * Represents a row in the query result.
   */
  class ResultRow {
      constructor(rawData) {
          this.DocNo = rawData.DocNo;
          this.IndexValues = rawData.IndexValues; // Usually an array of strings
          this.Size = rawData.Size;
          this.VersionNo = rawData.VersionNo;
          this.Status = rawData.Status;
      }
  }
  
  /**
   * Represents the full result of a query execution.
   */
  class QueryResult {
      constructor(apiResponse) {
          this.ResultRows = [];
          if (apiResponse && apiResponse.QueryResult && apiResponse.QueryResult.ResultRows) {
              // Check if it's an array or single object (API quirks) - usually array
              const rows = Array.isArray(apiResponse.QueryResult.ResultRows) 
                  ? apiResponse.QueryResult.ResultRows 
                  : [apiResponse.QueryResult.ResultRows];
              
              this.ResultRows = rows.map(r => new ResultRow(r));
          }
          this.Columns = apiResponse.QueryResult ? apiResponse.QueryResult.Columns : [];
      }
  }
  
  // --- Additional Response Types ---
  
  class ExecuteMultiQueryResponse {
      constructor(response) {
          this.Results = response.Results ? response.Results.map(r => new QueryResult({ QueryResult: r })) : [];
      }
  }
  
  class ExecuteUsersQueryResponse {
      constructor(response) {
          this.Users = response.Users || [];
      }
  }
  
  class GetCategoriesTreeResponse {
      constructor(response) {
          this.Tree = response.Tree; // Complex nested object
      }
  }
  
  class GetCategoryInfoResponse {
      constructor(response) {
          this.CategoryInfo = response.CategoryInfo;
      }
  }
  
  class GetUserDetailsResponse {
      constructor(response) {
          this.UserDetails = response.UserDetails;
      }
  }
  
  class GetWorkflowHistoryResponse {
      constructor(response) {
          this.History = response.History || [];
      }
  }
  
  class GetWorkflowInstanceResponse {
      constructor(response) {
          this.WorkflowInstance = response.WorkflowInstance;
      }
  }

  // --- Document Index Data Types ---

  /**
   * Response class for GetDocumentIndexData.
   * Wraps the full typed index data for a document including LastChangeTime.
   */
  class GetDocumentIndexDataResponse {
      constructor(response) {
          this.DocNo = response.DocNo;
          this.IndexData = response.IndexData; // { CategoryNo, IndexDataItems, LastChangeTime, LastChangeTimeISO8601, ... }
      }

      /**
       * Returns the raw typed item object for a field (e.g. { StringIndexData: { FieldName, DataValue } }).
       * @param {string} fieldName
       * @returns {object|null}
       */
      getField(fieldName) {
          const items = this.IndexData?.IndexDataItems || [];
          for (const item of items) {
              for (const typeKey of Object.keys(item)) {
                  const data = item[typeKey];
                  if (data && data.FieldName === fieldName) return data;
              }
          }
          return null;
      }

      /**
       * Returns the DataValue for a named field, or null if not found.
       * @param {string} fieldName
       * @returns {*}
       */
      getFieldValue(fieldName) {
          const field = this.getField(fieldName);
          return field ? field.DataValue : null;
      }
  }

  /**
   * Parameter class for UpdateDocument2 operation.
   * Requires LastChangeTime for concurrency safety — fetch from GetDocumentIndexData first,
   * or use client.updateDocument2() which auto-fetches it.
   */
  class UpdateDocument2Params {
      /**
       * @param {number} docNo
       * @param {Array<object>} indexDataItems - Typed IndexDataItems array.
       * @param {object} [options]
       * @param {string} [options.lastChangeTime] - WCF date string from GetDocumentIndexData.
       * @param {string} [options.lastChangeTimeISO8601] - ISO8601 date string from GetDocumentIndexData.
       * @param {boolean} [options.fillDependentFields=true]
       * @param {string} [options.checkInComments='']
       */
      constructor(docNo, indexDataItems, { lastChangeTime = null, lastChangeTimeISO8601 = null, fillDependentFields = true, checkInComments = '' } = {}) {
          this.DocNo = docNo;
          this.CheckInComments = checkInComments;
          this.IndexData = {
              IndexDataItems: indexDataItems,
              DoFillDependentFields: fillDependentFields,
              LastChangeTime: lastChangeTime,
              LastChangeTimeISO8601: lastChangeTimeISO8601
          };
      }
  }

  /**
   * Parameter class for GetKeywordsByFieldNo operation.
   */
  class GetKeywordsByFieldNoParams {
      constructor(fieldNo, categoryNo, showDeactivated = false) {
          this.FieldNo = fieldNo;
          this.CategoryNo = categoryNo;
          this.ShowDeactivatedKeywords = showDeactivated;
      }
  }

  /**
   * Response class for GetKeywordsByFieldNo.
   */
  class GetKeywordsByFieldNoResponse {
      constructor(response) {
          this.Keywords = response.Keywords || []; // [{ KeywordNo, KeywordName }]
      }

      /**
       * Find a keyword number by its display name (case-insensitive).
       * @param {string} name
       * @returns {number|null}
       */
      findKeywordNo(name) {
          const kw = this.Keywords.find(k => k.KeywordName.toLowerCase() === name.toLowerCase());
          return kw ? kw.KeywordNo : null;
      }
  }

  /**
   * Parameter class for AddStreamsToDocument operation.
   * Each stream: { StreamNo, FileName, FileDataBase64JSON, NewStreamInsertMode }
   * StreamNo 0 = primary. NewStreamInsertMode 0 = add new.
   */
  class AddStreamsToDocumentParams {
      constructor(docNo, streams) {
          this.DocNo = docNo;
          this.StreamsToUpload = streams;
      }
  }

  // ==========================================
  // PART 2: Client (from therefore-client.js)
  // ==========================================
  
  /**
   * Client for the Therefore REST API.
   */
  class ThereforeClient {
      /**
       * Creates an instance of ThereforeClient.
       * @param {object} options - Configuration options.
       * @param {string} options.baseUrl - The base URL of the Therefore REST API.
       * @param {string} [options.username] - Username for Basic Auth.
       * @param {string} [options.password] - Password for Basic Auth.
       * @param {string} [options.token] - Bearer token.
       * @param {string} [options.tenant] - Tenant name.
       */
      constructor(options = {}) {
          if (!options.baseUrl) {
              throw new Error('baseUrl is required in options.');
          }
          const baseUrl = options.baseUrl;
          this.baseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
          this.username = options.username || null;
          this.password = options.password || null;
          this.token = options.token || null;
          this.tenant = options.tenant || null;
      }
  
      /**
       * Sets the authentication token directly.
       * @param {string} token - The access token/JWT.
       */
      setToken(token) {
          this.token = token;
          this.username = null; // Clear basic auth if token is set
          this.password = null;
      }
  
      /**
       * Sets credentials for Basic Authentication.
       * @param {string} username - The username.
       * @param {string} password - The password.
       */
      setCredentials(username, password) {
          this.username = username;
          this.password = password;
          this.token = null; // Clear token if switching to basic auth
      }
  
      /**
       * Authenticates using username and password. 
       * In this implementation, it stores credentials for Basic Auth.
       * @param {string} username - The username.
       * @param {string} password - The password.
       */
      async login(username, password) {
          this.setCredentials(username, password);
      }
  
      /**
       * Gets a JWT token for the currently authenticated user.
       * @returns {Promise<string>} The received JWT token.
       */
      async getJWTToken() {
          const response = await this.execute('GetJWTToken', {});
          return response ? response.JWTToken : null;
      }
  
      /**
       * Generic method to execute an API operation.
       * @param {string} operation - The operation name (e.g., "CreateCase", "GetDocument").
       * @param {object} data - The data object to send in the body (or query params for GET).
       * @param {string} [method='POST'] - The HTTP method to use.
       * @returns {Promise<any>} The parsed JSON response.
       */
      async execute(operation, data = {}, method = 'POST') {
          let url = this.baseUrl + '/' + operation;
          const headers = {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
          };
  
          if (this.token) {
              headers['Authorization'] = 'Bearer ' + this.token;
          } else if (this.username && this.password) {
              const encoded = btoa(this.username + ':' + this.password); // Use btoa for browser
              headers['Authorization'] = 'Basic ' + encoded;
          }
          
          if (this.tenant) {
              headers['TenantName'] = this.tenant;
          }
  
          const options = {
              method: method,
              headers: headers
          };
  
          if (method.toUpperCase() === 'GET') {
              if (data && Object.keys(data).length > 0) {
                  const params = new URLSearchParams();
                  for (const [key, value] of Object.entries(data)) {
                      params.append(key, value);
                  }
                  url += '?' + params.toString();
              }
          } else {
              options.body = JSON.stringify(data);
          }
  
          const response = await fetch(url, options);
  
          if (!response.ok) {
              const errorText = await response.text();
              throw new Error('API Error (' + response.status + ' ' + response.statusText + '): ' + errorText + ' | URL: ' + url);
          }
  
          // Handle empty responses
          const text = await response.text();
          return text ? JSON.parse(text) : null;
      }
  
      /**
       * Executes a GET request.
       * @param {string} operation - The operation name.
       * @param {object} params - Query parameters.
       * @returns {Promise<any>}
       */
      async executeGet(operation, params = {}) {
          return this.execute(operation, params, 'GET');
      }
  
      // --- Case Operations ---
  
      /**
       * Creates a new case.
       * @param {object} caseParams - Parameters for creating a case.
       * @returns {Promise<object>} The server response containing the new case number.
       */
      async createCase(caseParams) {
          // Wrapper for CreateCase
          // caseParams should match the CreateCaseParams structure found in docs
          return this.execute('CreateCase', caseParams);
      }
  
      /**
       * Gets a case by Case Number.
       * @param {number} caseNo - The Case Number.
       * @returns {Promise<object>} The case details.
       */
      async getCase(caseNo) {
          return this.execute('GetCase', { CaseNo: caseNo });
      }
  
      /**
       * Closes a case.
       * @param {number} caseNo - The Case Number.
       * @returns {Promise<object>}
       */
      async closeCase(caseNo) {
          return this.execute('CloseCase', { CaseNo: caseNo });
      }
  
      /**
       * Deletes a case.
       * @param {number} caseNo - The Case Number.
       * @returns {Promise<object>}
       */
      async deleteCase(caseNo) {
          return this.execute('DeleteCase', { CaseNo: caseNo });
      }
  
      // --- Document Operations ---
  
      /**
       * Creates a new document.
       * @param {object} docParams - Parameters for creating a document (categoryNo, indexData, streams, etc.).
       * @returns {Promise<object>} Response containing total document number.
       */
      async createDocument(docParams) {
          return this.execute('CreateDocument', docParams);
      }
  
      /**
       * Gets a document.
       * @param {object} params - The GetDocumentParams object.
       * @returns {Promise<object>} The document details.
       */
      async getDocument(params) {
          const response = await this.execute('GetDocument', params);
          return new GetDocumentResponse(response);
      }
  
      /**
       * Gets full typed index data for a document, including LastChangeTime.
       * Use this to read field values or to get LastChangeTime before calling updateDocument2.
       * @param {number} docNo
       * @returns {Promise<GetDocumentIndexDataResponse>}
       */
      async getDocumentIndexData(docNo) {
          const response = await this.execute('GetDocumentIndexData', { DocNo: docNo });
          return new GetDocumentIndexDataResponse(response);
      }

      /**
       * Checks out a document.
       * @param {number} docNo - The Document Number.
       * @returns {Promise<object>}
       */
      async checkOutDocument(docNo) {
          return this.execute('CheckOutDocument', { DocNo: docNo });
      }
  
      /**
       * Checks in a document.
       * @param {number} docNo - The Document Number.
       * @param {string} [comment=''] - Check-in comment.
       * @returns {Promise<object>}
       */
      async checkInDocument(docNo, comment = '') {
          return this.execute('CheckInDocument', { DocNo: docNo, CheckInComment: comment });
      }
  
      /**
       * Deletes a document.
       * @param {number} docNo - The Document Number.
       * @returns {Promise<object>}
       */
      async deleteDocument(docNo) {
          return this.execute('DeleteDocument', { DocNo: docNo });
      }
  
      /**
       * Updates index data on an existing document with concurrency protection.
       * Automatically fetches LastChangeTime from GetDocumentIndexData if not provided.
       * @param {number} docNo
       * @param {Array<object>} indexDataItems - Typed IndexDataItems array (use IndexData builder).
       * @param {object} [options]
       * @param {string} [options.lastChangeTime] - WCF date string. Auto-fetched if omitted.
       * @param {string} [options.lastChangeTimeISO8601] - ISO8601 string. Auto-fetched if omitted.
       * @param {boolean} [options.fillDependentFields=true]
       * @param {string} [options.checkInComments='']
       * @returns {Promise<object>}
       */
      async updateDocument2(docNo, indexDataItems, options = {}) {
          let { lastChangeTime, lastChangeTimeISO8601, fillDependentFields = true, checkInComments = '' } = options;

          if (!lastChangeTime && !lastChangeTimeISO8601) {
              const current = await this.getDocumentIndexData(docNo);
              lastChangeTime = current.IndexData?.LastChangeTime || null;
              lastChangeTimeISO8601 = current.IndexData?.LastChangeTimeISO8601 || null;
          }

          const params = new UpdateDocument2Params(docNo, indexDataItems, {
              lastChangeTime, lastChangeTimeISO8601, fillDependentFields, checkInComments
          });
          return this.execute('UpdateDocument2', params);
      }

      /**
       * Adds one or more file streams to an existing document.
       * @param {number} docNo
       * @param {Array<object>} streams - Each: { StreamNo, FileName, FileDataBase64JSON, NewStreamInsertMode }
       *   StreamNo 0 = primary stream. NewStreamInsertMode 0 = insert new.
       * @returns {Promise<object>}
       */
      async addStreamsToDocument(docNo, streams) {
          return this.execute('AddStreamsToDocument', new AddStreamsToDocumentParams(docNo, streams));
      }

      /**
       * Gets a reference number by generating a temporary document in the specified category.
       * Sequence: Get Category -> Create Document -> Read Index -> Delete Document.
       * @param {string} referenceCategory - The name of the reference category.
       * @returns {Promise<string|null>} The reference number (first index value) or null if failed.
       */
      async getReferenceNumber(referenceCategory) {
          // 1. Get category number
          const categoryNo = await this.getCategoryNoFromName(referenceCategory);
          if (!categoryNo) {
              throw new Error('Category not found: ' + referenceCategory);
          }
  
          // 2. Create document (no index data, no streams)
          const createResponse = await this.createDocument({
              CategoryNo: categoryNo,
              IndexData: {},
              Streams: []
          });
  
          if (!createResponse || !createResponse.DocNo) {
              throw new Error('Failed to create temporary document for reference number.');
          }
  
          const docNo = createResponse.DocNo;
          let refNumber = null;
  
          try {
              // 3. Read index data (retrieve first column)
              // Use GetDocumentParams with optimized flags (only need IndexData)
              const getParams = new GetDocumentParams({ 
                  DocNo: docNo,
                  IsIndexDataValuesNeeded: true,
                  IsCheckOutStatusNeeded: false,
                  IsStreamsInfoAndDataNeeded: false,
                  IsStreamsInfoNeeded: false
              });
              const docDetails = await this.getDocument(getParams);
              if (docDetails.IndexData && docDetails.IndexData.IndexDataItems && docDetails.IndexData.IndexDataItems.length > 0) {
                  const firstItem = docDetails.IndexData.IndexDataItems[0];
                  // Check common types: String or Int or Money. Sample showed 'StringIndexData'
                  // But simplified for robustness
                  if (firstItem.StringIndexData) {
                      refNumber = firstItem.StringIndexData.DataValue;
                  } else if (firstItem.IntIndexData) {
                      refNumber = firstItem.IntIndexData.DataValue;
                  } else if (firstItem.MoneyIndexData) {
                      refNumber = firstItem.MoneyIndexData.DataValue;
                  }
              }
          } finally {
              // 4. Delete document
              await this.deleteDocument(docNo);
          }
  
          return refNumber;
      }
  
      // --- Query Operations ---
  
      /**
       * Executes a single query.
       * @param {object} queryParams - The query parameters.
       * @returns {Promise<object>} The query results.
       */
      async executeSingleQuery(queryParams) {
          return this.execute('ExecuteSingleQuery', queryParams);
      }
      
      /**
       * Executes an async query and collects ALL pages into a single result.
       * Preferred over executeSingleQuery for production — properly releases server resources.
       * @param {object} queryParams - Same structure as executeSingleQuery ({ Query: ... }).
       * @param {number} [maxRows=0] - Maximum rows to return. 0 = all rows.
       * @returns {Promise<{QueryResult: {Columns, ResultRows}, TotalRows: number}>}
       */
      async executeAsyncSingleQuery(queryParams, maxRows = 0) {
          const firstResponse = await this.execute('ExecuteAsyncSingleQuery', queryParams);
          const queryId = firstResponse.QueryId; // Note: lowercase 'd' in response
          const columns = firstResponse.QueryResult?.Columns || [];
          const allRows = [...(firstResponse.QueryResult?.ResultRows || [])];

          try {
              let hasMore = firstResponse.HasRemainingRows;

              while (hasMore && (maxRows === 0 || allRows.length < maxRows)) {
                  const nextResponse = await this.execute('GetNextSingleQueryRows', {
                      QueryID: queryId, // Note: uppercase 'D' for subsequent calls
                      RowBlockSize: 200
                  });
                  const rows = nextResponse.QueryResult?.ResultRows || [];
                  allRows.push(...rows);
                  hasMore = nextResponse.HasRemainingRows;
              }
          } finally {
              await this.execute('ReleaseSingleQuery', { QueryID: queryId });
          }

          const resultRows = maxRows > 0 ? allRows.slice(0, maxRows) : allRows;
          return {
              QueryResult: { Columns: columns, ResultRows: resultRows },
              TotalRows: resultRows.length
          };
      }

      // --- Workflow Operations ---
  
      /**
       * Starts a workflow instance.
       * @param {number} docNo 
       * @param {number} processNo 
       * @returns {Promise<object>}
       */
      async startWorkflowInstance(docNo, processNo) {
          return this.execute('StartWorkflowInstance', { DocNo: docNo, ProcessNo: processNo });
      }
  
      /**
       * Claims a workflow instance.
       * @param {number} instanceNo
       * @param {number} tokenNo
       * @returns {Promise<object>}
       */
      async claimWorkflowInstance(instanceNo, tokenNo) {
          return this.execute('ClaimWorkflowInstance', { InstanceNo: instanceNo, TokenNo: tokenNo });
      }

      /**
       * Finishes the current workflow task.
       * @param {number} instanceNo
       * @param {number} tokenNo
       * @param {number} nextTaskNo
       * @param {object} [options]
       * @param {string} [options.textInformation] - Optional comment/note.
       * @param {object} [options.nextUsers] - Optional next user assignment ({ NextUserNoList: [userNo, ...] }).
       * @returns {Promise<object>}
       */
      async finishCurrentWorkflowTask(instanceNo, tokenNo, nextTaskNo, options = {}) {
          const params = { InstanceNo: instanceNo, TokenNo: tokenNo, NextTaskNo: nextTaskNo };
          if (options.textInformation) params.TextInformation = options.textInformation;
          if (options.nextUsers)       params.NextUsers = options.nextUsers;
          return this.execute('FinishCurrentWorkflowTask', params);
      }
  
      // --- Comment Operations ---
  
      /**
       * Adds a comment to a document.
       * ObjType 2 = document, 38 = case, 21 = workflow instance.
       * @param {number} docNo
       * @param {string} text
       * @param {number} [objType=2]
       * @returns {Promise<object>}
       */
      async addComment(docNo, text, objType = 2) {
          return this.execute('AddComment', { ObjNo: docNo, ObjType: objType, CommentText: text });
      }
  
      /**
       * Gets comments for a document.
       * @param {number} docNo 
       * @returns {Promise<object>}
       */
      /**
       * Gets comments for an object.
       * ObjType 2 = document, 38 = case, 21 = workflow instance.
       * @param {number} objNo
       * @param {number} [maxCount=100]
       * @param {number} [objType=2]
       * @returns {Promise<object>}
       */
      async getComments(objNo, maxCount = 100, objType = 2) {
          return this.execute('LoadComments', { ObjNo: objNo, ObjType: objType, MaxCount: maxCount });
      }
      
      // --- Admin/User Operations ---
  
      /**
       * Gets the connected user info.
       * @returns {Promise<object>}
       */
      async getConnectedUser() {
          return this.execute('GetConnectedUser', {});
      }
  
      /**
       * Helper to find a category number by its name.
       * Fetches the entire category tree and searches recursively.
       * @param {string} categoryName - The name of the category to find.
       * @returns {Promise<number|null>} The category number or null if not found.
       */
      async getCategoryNoFromName(categoryName) {
          const response = await this.execute('GetCategoriesTree', {});
          // The API returns { TreeItems: [ ... ] } based on the debug output
          
          const findCategory = (items) => {
              if (!items || !Array.isArray(items)) return null;
  
              for (const item of items) {
                  // Check if this node is the category we are looking for (ItemType 2 = Category)
                  if (item.ItemType === 2 && item.Name === categoryName) {
                      return item.ItemNo;
                  }
  
                  // Search children
                  if (item.ChildItems && item.ChildItems.length > 0) {
                      const result = findCategory(item.ChildItems);
                      if (result !== null) return result;
                  }
              }
              return null;
          };
  
          if (response && response.TreeItems) {
              return findCategory(response.TreeItems);
          }
          return null;
      }

      /**
       * Gets detailed category metadata including all field definitions.
       * @param {number} categoryNo
       * @returns {Promise<GetCategoryInfoResponse>}
       */
      async getCategoryInfo(categoryNo) {
          const response = await this.execute('GetCategoryInfo', new GetCategoryInfoParams(categoryNo));
          return new GetCategoryInfoResponse(response);
      }

      // --- Referenced Table Operations ---

      /**
       * Queries all rows from a named referenced table.
       *
       * Resolves the table name → DataTypeNo via GetObjects, derives CategoryNo from
       * the TableName field returned by GetReferencedTableInfo (e.g. "TheCat43" → 43),
       * then pages through all results using ExecuteAsyncSingleQuery / GetNextSingleQueryRows.
       *
       * @param {string} tableName - Referenced table name (case-insensitive).
       * @param {Array<{FieldNoOrName: string, Condition: string}>} [conditions=[]]
       *   e.g. [{ FieldNoOrName: 'Entity', Condition: '*' }]
       * @param {object} [options]
       * @param {number} [options.maxRows=5000]   - Max rows to return.
       * @param {number} [options.blockSize=1000]  - Pagination block size.
       * @returns {Promise<{dataTypeNo, categoryNo, name, columns, rowCount, rows}>}
       *   rows[i].IndexValues maps positionally to columns[i].ColName
       *   rows[i].DocNo is the document number
       */
      async queryReferencedTable(tableName, conditions = [], { maxRows = 5000, blockSize = 1000 } = {}) {
          // 1. Discover DataTypeNo by name (Type 5 = referenced tables)
          const objectsResp = await this.execute('GetObjects?limit=1000&skip=0', { Flags: 0, Type: 5, PermType: 8 });
          const items = objectsResp.ItemList ?? objectsResp.Items ?? [];
          const nameLower = tableName.toLowerCase();
          const match = items.find(item => (item.Name ?? '').toLowerCase() === nameLower);
          if (!match) throw new Error(`Referenced table '${tableName}' not found`);
          const dataTypeNo = Number(match.ID);

          // 2. Get table info — parse CategoryNo from TableName (e.g. "TheCat43" → 43)
          const tableInfo = await this.execute('GetReferencedTableInfo', { DataTypeNo: dataTypeNo });
          const tableNameStr = tableInfo.TableName ?? '';
          const catMatch = tableNameStr.match(/\d+$/);
          if (!catMatch) throw new Error(`Cannot parse CategoryNo from TableName: '${tableNameStr}'`);
          const categoryNo = Number(catMatch[0]);

          // 3. Start async query — first response includes QueryId and first page
          const firstResp = await this.execute('ExecuteAsyncSingleQuery', {
              Query: {
                  CategoryNo: categoryNo,
                  Conditions: conditions,
                  MaxRows: maxRows,
                  RowBlockSize: blockSize,
              },
          });

          const queryId = firstResp.QueryId ?? firstResp.QueryID;
          const rows = [...(firstResp.QueryResult?.ResultRows ?? [])];
          let hasMore = Boolean(firstResp.HasRemainingRows);

          // 4. Page through remaining rows
          try {
              while (hasMore && queryId != null) {
                  const nextResp = await this.execute('GetNextSingleQueryRows', {
                      QueryID: queryId,
                      RowBlockSize: blockSize,
                  });
                  rows.push(...(nextResp.QueryResult?.ResultRows ?? []));
                  hasMore = Boolean(nextResp.HasRemainingRows);
              }
          } finally {
              if (queryId != null) {
                  this.execute('ReleaseSingleQuery', { QueryID: queryId }).catch(() => {});
              }
          }

          return {
              dataTypeNo,
              categoryNo,
              name: tableInfo.Name,
              columns: tableInfo.Columns ?? [],
              rowCount: rows.length,
              rows,
          };
      }

      /**
       * Gets all keyword entries for a field. Use findKeywordNo() on the response
       * to resolve a display string to its numeric KeywordNo before writing.
       * @param {number} fieldNo
       * @param {number} categoryNo
       * @param {boolean} [showDeactivated=false]
       * @returns {Promise<GetKeywordsByFieldNoResponse>}
       */
      async getKeywordsByFieldNo(fieldNo, categoryNo, showDeactivated = false) {
          const params = new GetKeywordsByFieldNoParams(fieldNo, categoryNo, showDeactivated);
          const response = await this.execute('GetKeywordsByFieldNo', params);
          return new GetKeywordsByFieldNoResponse(response);
      }
  }
  
  /**
   * Helper function to retrieve configuration from browser LocalStorage.
   * Expects 'infrastructureInfo' and 'loginInfo' keys to exist (standard Therefore Web functionality).
   * Also decodes the JWT to extract the username if possible.
   * @returns {object|null} Object containing { token, isAnonymous, apiUrl, tenant, username } or null if not found.
   */
  function getConfigurationFromLocalStorage() {
      // Check if running in a browser environment with localStorage
      if (typeof window === 'undefined' || !window.localStorage) {
          return null;
      }
  
      const infraRaw = localStorage.getItem('infrastructureInfo');
      const loginRaw = localStorage.getItem('loginInfo');
  
      if (!infraRaw || !loginRaw) {
          return null;
      }
  
      try {
          const infra = JSON.parse(infraRaw);
          const login = JSON.parse(loginRaw);
  
          let username = null;
          if (login.token) {
              try {
                  // simple jwt decode
                  const parts = login.token.split('.');
                  if (parts.length === 3) {
                      const payload = JSON.parse(atob(parts[1]));
                      // Try common claims for username
                      username = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/windowsaccountname'] || 
                                 payload['unique_name'] || 
                                 payload['name'] || 
                                 payload['sub'];
                  }
              } catch (ignore) {
                  // Token parse failed, ignore
              }
          }
  
          return {
              token: login.token || null, // null if undefined/empty
              isAnonymous: login.isAnonymous,
              apiUrl: infra.apiUrl || null,
              tenant: infra.tenant || null,
              username: username
          };
      } catch (e) {
          console.error('Error parsing Therefore configuration from LocalStorage:', e);
          return null;
      }
  }
  
  
  
  /**
   * Utility to convert a File/Blob (Browser) or Buffer (Node) to Base64 string for StreamData.
   * @param {File|Blob|Buffer} fileData - The file object or buffer.
   * @returns {Promise<string>} Base64 string without data prefix.
   */
  function fileToBase64(fileData) {
      return new Promise((resolve, reject) => {
          // Browser Environment (File or Blob)
          if (typeof Blob !== 'undefined' && fileData instanceof Blob) {
              const reader = new FileReader();
              reader.onload = () => {
                  // result is "data:application/octet-stream;base64,....."
                  // We need to strip the prefix
                  const result = reader.result;
                  const base64 = result.split(',')[1];
                  resolve(base64);
              };
              reader.onerror = error => reject(error);
              reader.readAsDataURL(fileData);
          } else {
              reject(new Error('Unsupported file data type. Expected File or Blob.'));
          }
      });
  }
  
  
  // ==========================================
  // Therefore Form.io Helper Functions
  // ==========================================
  
  /**
   * Redraws a specific component in the Form.io form.
   * @param {string} componentName - The name of the component to redraw.
   */
  function redrawComponent(componentName) {
    const c = utils && utils.getComponent(form.components, componentName);
      if (c)
      {
	    c.triggerChange();
	    c.triggerRedraw();
      }
  }
  
  // ==========================================
  // PART 3: Global Registration
  // ==========================================
  
  (function() {
      // Attach everything to window.Therefore
      window.Therefore = {
          ThereforeClient,
          getConfigurationFromLocalStorage,
          fileToBase64,
          GetJWTTokenParams,
          CreateCaseParams,
          GetCaseParams,
          ExecuteSingleQueryParams,
          CreateDocumentParams,
          GetDocumentParams,
          CheckOutDocumentParams,
          CheckInDocumentParams,
          DeleteDocumentParams,
          SaveDocumentIndexDataParams,
          IndexData,
          SaveDocumentIndexDataQuickParams,
          UpdateDocumentParams,
          GetDocumentStreamParams,
          CreateDocumentResponse,
          GetDocumentResponse,
          GetDocumentStreamResponse,
          GetDocumentIndexDataResponse,
          UpdateDocument2Params,
          GetKeywordsByFieldNoParams,
          GetKeywordsByFieldNoResponse,
          AddStreamsToDocumentParams,
          GetWorkflowHistoryParams,
          GetWorkflowInstanceParams,
          StartWorkflowInstanceParams,
          ClaimWorkflowInstanceParams,
          FinishCurrentWorkflowTaskParams,
          AddCommentParams,
          CreateUserParams,
          ExecuteUsersQueryParams,
          GetCategoriesTreeParams,
          GetCategoryInfoParams,
          GetUserDetailsParams,
          ExecuteMultiQueryParams,
          Condition,
          QueryDefinition,
          ResultRow,
          QueryResult,
          ExecuteMultiQueryResponse,
          ExecuteUsersQueryResponse,
          GetCategoriesTreeResponse,
          GetCategoryInfoResponse,
          GetUserDetailsResponse,
          GetWorkflowHistoryResponse,
          GetWorkflowInstanceResponse,
          redrawComponent
      };
  
      console.log('Therefore Client Library loaded. Access via window.Therefore');
  })();
