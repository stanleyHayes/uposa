import { Request } from 'express';
import { ParamsFlatDictionary } from 'express-serve-static-core';

export type RouteRequest = Request<ParamsFlatDictionary>;
