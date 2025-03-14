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

import {QuerySelection} from '../ProfileSelector';
import {ProfileSelection, ProfileSelectionFromParams, SuffixParams} from '..';
import ProfileExplorerSingle from './ProfileExplorerSingle';
import ProfileExplorerCompare from './ProfileExplorerCompare';
import {QueryServiceClient} from '@parca/client';
import {
  useAppSelector,
  useAppDispatch,
  setCompare,
  selectCompareMode,
  setSearchNodeString,
  store,
} from '@parca/store';
import {Provider, batch} from 'react-redux';
import {DateTimeRange} from '@parca/components';
import {useEffect} from 'react';

export type NavigateFunction = (path: string, queryParams: any) => void;

interface ProfileExplorerProps {
  queryClient: QueryServiceClient;
  queryParams: any;
  navigateTo: NavigateFunction;
}

const getExpressionAsAString = (expression: string | []): string => {
  const x = Array.isArray(expression) ? expression.join() : expression;
  return x;
};

/* eslint-disable @typescript-eslint/naming-convention */
const sanitizeDateRange = (
  time_selection_a: string,
  from_a: number,
  to_a: number
): {time_selection_a: string; from_a: number; to_a: number} => {
  const range = DateTimeRange.fromRangeKey(time_selection_a);
  if (from_a == null && to_a == null) {
    from_a = range.getFromMs();
    to_a = range.getToMs();
  }
  return {time_selection_a: range.getRangeKey(), from_a, to_a};
};
/* eslint-enable @typescript-eslint/naming-convention */

const ProfileExplorerApp = ({
  queryClient,
  queryParams,
  navigateTo,
}: ProfileExplorerProps): JSX.Element => {
  const dispatch = useAppDispatch();
  const compareMode = useAppSelector(selectCompareMode);

  /* eslint-disable @typescript-eslint/naming-convention */
  let {
    from_a,
    to_a,
    merge_a,
    profile_name_a,
    labels_a,
    time_a,
    time_selection_a,
    compare_a,
    from_b,
    to_b,
    merge_b,
    profile_name_b,
    labels_b,
    time_b,
    time_selection_b,
    compare_b,
  } = queryParams;
  /* eslint-enable @typescript-eslint/naming-convention */

  const sanitizedRange = sanitizeDateRange(time_selection_a, from_a, to_a);
  time_selection_a = sanitizedRange.time_selection_a;
  from_a = sanitizedRange.from_a;
  to_a = sanitizedRange.to_a;

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const expression_a = getExpressionAsAString(queryParams.expression_a);

  // eslint-disable-next-line @typescript-eslint/naming-convention
  const expression_b = getExpressionAsAString(queryParams.expression_b);

  if ((queryParams?.expression_a ?? '') !== '') queryParams.expression_a = expression_a;
  if ((queryParams?.expression_b ?? '') !== '') queryParams.expression_b = expression_b;

  useEffect(() => {
    if (compare_a === 'true' && compare_b === 'true') {
      dispatch(setCompare(true));
    } else {
      dispatch(setCompare(false));
    }
  }, [dispatch, compare_a, compare_b]);

  const filterSuffix = (
    o: {[key: string]: string | string[] | undefined},
    suffix: string
  ): {[key: string]: string | string[] | undefined} =>
    Object.fromEntries(Object.entries(o).filter(([key]) => !key.endsWith(suffix)));

  const swapQueryParameters = (o: {
    [key: string]: string | string[] | undefined;
  }): {[key: string]: string | string[] | undefined} => {
    Object.entries(o).forEach(([key, value]) => {
      if (key.endsWith('_b')) {
        o[key.slice(0, -2) + '_a'] = value;
      }
    });
    return o;
  };

  const selectProfileA = (p: ProfileSelection): void => {
    queryParams.expression_a = encodeURIComponent(queryParams.expression_a);
    queryParams.expression_b = encodeURIComponent(queryParams.expression_b);
    return navigateTo('/', {
      ...queryParams,
      ...SuffixParams(p.HistoryParams(), '_a'),
    });
  };

  const selectProfileB = (p: ProfileSelection): void => {
    queryParams.expression_a = encodeURIComponent(queryParams.expression_a);
    queryParams.expression_b = encodeURIComponent(queryParams.expression_b);
    return navigateTo('/', {
      ...queryParams,
      ...SuffixParams(p.HistoryParams(), '_b'),
    });
  };

  // Show the SingleProfileExplorer when not comparing
  if (compare_a !== 'true' && compare_b !== 'true') {
    const query = {
      expression: expression_a,
      from: parseInt(from_a as string),
      to: parseInt(to_a as string),
      merge: (merge_a as string) === 'true',
      profile_name: profile_name_a as string,
      timeSelection: time_selection_a as string,
    };

    const profile = ProfileSelectionFromParams(
      expression_a,
      from_a as string,
      to_a as string,
      merge_a as string,
      labels_a as string[],
      profile_name_a as string,
      time_a as string
    );

    const selectQuery = (q: QuerySelection): void => {
      return navigateTo(
        '/',
        // Filtering the _a suffix causes us to reset potential profile
        // selection when running a new query.
        {
          ...filterSuffix(queryParams, '_a'),
          ...{
            expression_a: encodeURIComponent(q.expression),
            from_a: q.from.toString(),
            to_a: q.to.toString(),
            merge_a: q.merge,
            time_selection_a: q.timeSelection,
            currentProfileView: 'icicle',
          },
        }
      );
    };

    const selectProfile = (p: ProfileSelection): void => {
      queryParams.expression_a = encodeURIComponent(queryParams.expression_a);
      return navigateTo('/', {
        ...queryParams,
        ...SuffixParams(p.HistoryParams(), '_a'),
      });
    };

    const compareProfile = (): void => {
      let compareQuery = {
        compare_a: 'true',
        expression_a: encodeURIComponent(query.expression),
        from_a: query.from.toString(),
        to_a: query.to.toString(),
        merge_a: query.merge,
        time_selection_a: query.timeSelection,
        profile_name_a: query.profile_name,

        compare_b: 'true',
        expression_b: encodeURIComponent(query.expression),
        from_b: query.from.toString(),
        to_b: query.to.toString(),
        merge_b: query.merge,
        time_selection_b: query.timeSelection,
        profile_name_b: query.profile_name,
      };

      if (profile != null) {
        compareQuery = {
          ...SuffixParams(profile.HistoryParams(), '_a'),
          ...compareQuery,
        };
      }

      compareQuery = {
        ...compareQuery,
        ...{
          currentProfileView: 'icicle',
        },
      };

      batch(() => {
        dispatch(setCompare(!compareMode));
        dispatch(setSearchNodeString(undefined));
      });

      void navigateTo('/', compareQuery);
    };

    return (
      <ProfileExplorerSingle
        queryClient={queryClient}
        query={query}
        profile={profile}
        selectQuery={selectQuery}
        selectProfile={selectProfile}
        compareProfile={compareProfile}
        navigateTo={navigateTo}
      />
    );
  }

  const queryA = {
    expression: expression_a,
    from: parseInt(from_a as string),
    to: parseInt(to_a as string),
    merge: (merge_a as string) === 'true',
    timeSelection: time_selection_a as string,
    profile_name: profile_name_a as string,
  };
  const queryB = {
    expression: expression_b,
    from: parseInt(from_b as string),
    to: parseInt(to_b as string),
    merge: (merge_b as string) === 'true',
    timeSelection: time_selection_b as string,
    profile_name: profile_name_b as string,
  };

  const profileA = ProfileSelectionFromParams(
    expression_a,
    from_a as string,
    to_a as string,
    merge_a as string,
    labels_a as string[],
    profile_name_a as string,
    time_a as string
  );
  const profileB = ProfileSelectionFromParams(
    expression_b,
    from_b as string,
    to_b as string,
    merge_b as string,
    labels_b as string[],
    profile_name_b as string,
    time_b as string
  );

  const selectQueryA = (q: QuerySelection): void => {
    return navigateTo(
      '/',
      // Filtering the _a suffix causes us to reset potential profile
      // selection when running a new query.
      {
        ...filterSuffix(queryParams, '_a'),
        ...{
          compare_a: 'true',
          expression_a: encodeURIComponent(q.expression),
          expression_b: encodeURIComponent(expression_b),
          from_a: q.from.toString(),
          to_a: q.to.toString(),
          merge_a: q.merge,
          time_selection_a: q.timeSelection,
        },
      }
    );
  };

  const selectQueryB = (q: QuerySelection): void => {
    return navigateTo(
      '/',
      // Filtering the _b suffix causes us to reset potential profile
      // selection when running a new query.
      {
        ...filterSuffix(queryParams, '_b'),
        ...{
          compare_b: 'true',
          expression_b: encodeURIComponent(q.expression),
          expression_a: encodeURIComponent(expression_a),
          from_b: q.from.toString(),
          to_b: q.to.toString(),
          merge_b: q.merge,
          time_selection_b: q.timeSelection,
        },
      }
    );
  };

  const closeProfile = (card: string): void => {
    let newQueryParameters = queryParams;
    if (card === 'A') {
      newQueryParameters = swapQueryParameters(queryParams);
    }

    batch(() => {
      dispatch(setCompare(!compareMode));
      dispatch(setSearchNodeString(undefined));
    });

    return navigateTo('/', {
      ...filterSuffix(newQueryParameters, '_b'),
      ...{
        compare_a: 'false',
      },
    });
  };

  return (
    <ProfileExplorerCompare
      queryClient={queryClient}
      queryA={queryA}
      queryB={queryB}
      profileA={profileA}
      profileB={profileB}
      selectQueryA={selectQueryA}
      selectQueryB={selectQueryB}
      selectProfileA={selectProfileA}
      selectProfileB={selectProfileB}
      closeProfile={closeProfile}
      navigateTo={navigateTo}
    />
  );
};

const ProfileExplorer = ({
  queryClient,
  queryParams,
  navigateTo,
}: ProfileExplorerProps): JSX.Element => {
  const {store: reduxStore} = store();

  return (
    <Provider store={reduxStore}>
      <ProfileExplorerApp
        queryClient={queryClient}
        queryParams={queryParams}
        navigateTo={navigateTo}
      />
    </Provider>
  );
};

export default ProfileExplorer;
