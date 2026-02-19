import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({
  tableName: 'pit_stops',
  timestamps: true,
  underscored: true
})
export default class PitStops extends Model {
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
    field: 'driver_number'
  })
  driverNumber!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'lap_number'
  })
  lapNumber!: number;

  @Column({
    type: DataType.DECIMAL(8, 3),
    field: 'pit_duration'
  })
  pitDuration!: number;

  @Column({
    type: DataType.DECIMAL(8, 3),
    field: 'stop_duration'
  })
  stopDuration!: number;

  @Column(DataType.DATE)
  date!: Date;
}