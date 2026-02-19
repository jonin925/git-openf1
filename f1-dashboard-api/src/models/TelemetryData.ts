import { Table, Column, Model, DataType, PrimaryKey, AutoIncrement, Index } from 'sequelize-typescript';

@Table({
  tableName: 'telemetry_data',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['session_key', 'driver_number'] },
    { fields: ['date'] }
  ]
})
export default class TelemetryData extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'session_key',
    allowNull: false
  })
  sessionKey!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'driver_number',
    allowNull: false
  })
  driverNumber!: number;

  @Column({
    type: DataType.DATE,
    allowNull: false
  })
  date!: Date;

  @Column(DataType.INTEGER)
  speed!: number;

  @Column(DataType.INTEGER)
  rpm!: number;

  @Column(DataType.INTEGER)
  throttle!: number;

  @Column(DataType.INTEGER)
  brake!: number;

  @Column(DataType.INTEGER)
  drs!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'n_gear'
  })
  nGear!: number;

  @Column({
    type: DataType.DATE,
    field: 'created_at'
  })
  createdAt!: Date;

  @Column({
    type: DataType.DATE,
    field: 'updated_at'
  })
  updatedAt!: Date;
}