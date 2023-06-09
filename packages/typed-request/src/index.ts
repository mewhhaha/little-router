export type RequestMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

export type QueryString<STRING, QUERY_PARAMS extends string> = STRING extends ""
  ? ""
  : STRING extends `?${infer REST}`
  ? `?${QueryString<REST, QUERY_PARAMS>}`
  : STRING extends `${infer PARAM extends QUERY_PARAMS}&${infer REST}`
  ? REST extends ""
    ? never
    : `${PARAM}&${QueryString<REST, QUERY_PARAMS>}`
  : STRING extends QUERY_PARAMS
  ? STRING
  : never;

export interface GetRequestInit extends RequestInit {
  method?: "GET";
  body?: never;
}

export interface PostRequestInit extends RequestInit {
  method: "POST";
}

export interface PutRequestInit extends RequestInit {
  method: "PUT";
}

export interface DeleteRequestInit extends RequestInit {
  method: "DELETE";
}

export interface PatchRequestInit extends RequestInit {
  method: "PATCH";
}
