import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement } from 'sequelize-typescript';

@Table({
  tableName: 'lap_data',
  timestamps: true,
  underscored: true
})
export default class LapData extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
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
    type: DataType.DECIMAL(10, 3),
    field: 'lap_duration'
  })
  lapDuration!: number;

  @Column({
    type: DataType.DECIMAL(10, 3),
    field: 'duration_sector_1'
  })
  durationSector1!: number;

  @Column({
    type: DataType.DECIMAL(10, 3),
    field: 'duration_sector_2'
  })
  durationSector2!: number;

  @Column({
    type: DataType.DECIMAL(10, 3),
    field: 'duration_sector_3'
  })
  durationSector3!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'i1_speed'
  })
  i1Speed!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'i2_speed'
  })
  i2Speed!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'st_speed'
  })
  stSpeed!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_pit_out_lap'
  })
  isPitOutLap!: boolean;

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    field: 'segments_sector_1'
  })
  segmentsSector1!: number[];

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    field: 'segments_sector_2'
  })
  segmentsSector2!: number[];

  @Column({
    type: DataType.ARRAY(DataType.INTEGER),
    field: 'segments_sector_3'
  })
  segmentsSector3!: number[];
}