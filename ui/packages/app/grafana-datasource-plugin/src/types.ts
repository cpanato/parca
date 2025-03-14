// Copyright 2022 The Parca Authors
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface ParcaQuery extends DataQuery {
  parcaQuery: string;
}

export const defaultQuery: Partial<ParcaQuery> = {
  parcaQuery: 'process_cpu:cpu:nanoseconds:cpu:nanoseconds:delta{job="default"}',
};

/**
 * These are options configured for each DataSource instance
 */
export interface ParcaDataSourceOptions extends DataSourceJsonData {
  APIEndpoint?: string;
}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {
  apiKey?: string;
}
