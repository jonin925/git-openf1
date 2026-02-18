
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const f1Api = createApi({
  reducerPath: 'f1Api',
  baseQuery: fetchBaseQuery({ 
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['Years', 'Meetings', 'Sessions', 'Results', 'Telemetry'],
  endpoints: (builder) => ({
    // Years
    getYears: builder.query<Year[], void>({
      query: () => '/years',
      providesTags: ['Years'],
    }),

    // Meetings (Races)
    getMeetingsByYear: builder.query<Meeting[], number>({
      query: (year) => `/meetings?year=${year}`,
      providesTags: (result, error, year) => [{ type: 'Meetings', id: year }],
    }),

    getMeetingById: builder.query<Meeting, number>({
      query: (meetingKey) => `/meetings/${meetingKey}`,
    }),

    // Sessions
    getSessionsByMeeting: builder.query<Session[], number>({
      query: (meetingKey) => `/sessions?meeting_key=${meetingKey}`,
      providesTags: (result, error, meetingKey) => [{ type: 'Sessions', id: meetingKey }],
    }),

    getSessionById: builder.query<Session, number>({
      query: (sessionKey) => `/sessions/${sessionKey}`,
    }),

    // Results
    getSessionResults: builder.query<SessionResult[], number>({
      query: (sessionKey) => `/results?session_key=${sessionKey}`,
      providesTags: (result, error, sessionKey) => [{ type: 'Results', id: sessionKey }],
    }),

    getQualifyingResults: builder.query<QualifyingResult[], number>({
      query: (sessionKey) => `/results/qualifying?session_key=${sessionKey}`,
    }),

    getRaceResults: builder.query<RaceResult[], number>({
      query: (sessionKey) => `/results/race?session_key=${sessionKey}`,
    }),

    // Standings
    getDriverStandings: builder.query<DriverStanding[], number>({
      query: (sessionKey) => `/standings/drivers?session_key=${sessionKey}`,
    }),

    getConstructorStandings: builder.query<ConstructorStanding[], number>({
      query: (sessionKey) => `/standings/constructors?session_key=${sessionKey}`,
    }),

    // Telemetry
    getCarData: builder.query<CarDataPoint[], { sessionKey: number; driverNumber: number }>({
      query: ({ sessionKey, driverNumber }) => 
        `/telemetry/car?session_key=${sessionKey}&driver_number=${driverNumber}`,
    }),

    getLapData: builder.query<LapData[], { sessionKey: number; driverNumber?: number }>({
      query: ({ sessionKey, driverNumber }) => {
        let url = `/telemetry/laps?session_key=${sessionKey}`;
        if (driverNumber) url += `&driver_number=${driverNumber}`;
        return url;
      },
    }),

    getLocationData: builder.query<LocationPoint[], { sessionKey: number; driverNumber?: number }>({
      query: ({ sessionKey, driverNumber }) => {
        let url = `/telemetry/location?session_key=${sessionKey}`;
        if (driverNumber) url += `&driver_number=${driverNumber}`;
        return url;
      },
    }),
  }),
});

export const {
  useGetYearsQuery,
  useGetMeetingsByYearQuery,
  useGetMeetingByIdQuery,
  useGetSessionsByMeetingQuery,
  useGetSessionByIdQuery,
  useGetSessionResultsQuery,
  useGetQualifyingResultsQuery,
  useGetRaceResultsQuery,
  useGetDriverStandingsQuery,
  useGetConstructorStandingsQuery,
  useGetCarDataQuery,
  useGetLapDataQuery,
  useGetLocationDataQuery,
} = f1Api;