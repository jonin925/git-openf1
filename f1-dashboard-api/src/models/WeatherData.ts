import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({
  tableName: 'weather_data',
  timestamps: true,
  underscored: true
})
export default class WeatherData extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'session_key'
  })
  sessionKey!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'meeting_key'
  })
  meetingKey!: number;

  @Column(DataType.DATE)
  date!: Date;

  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'air_temperature'
  })
  airTemperature!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'track_temperature'
  })
  trackTemperature!: number;

  @Column(DataType.INTEGER)
  humidity!: number;

  @Column({
    type: DataType.DECIMAL(7, 2)
  })
  pressure!: number;

  @Column({
    type: DataType.DECIMAL(5, 2),
    field: 'wind_speed'
  })
  windSpeed!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'wind_direction'
  })
  windDirection!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  rainfall!: boolean;
}