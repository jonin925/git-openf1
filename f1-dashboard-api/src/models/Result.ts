import { 
  Table, Column, Model, DataType, 
  ForeignKey, BelongsTo, PrimaryKey, AutoIncrement 
} from 'sequelize-typescript';
import Meeting from './Meeting';
import Session from './Session';

@Table({
  tableName: 'results',
  timestamps: true,
  underscored: true
})
export default class Result extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @ForeignKey(() => Session)
  @Column({
    type: DataType.INTEGER,
    field: 'session_key'
  })
  sessionKey!: number;

  @ForeignKey(() => Meeting)
  @Column({
    type: DataType.INTEGER,
    field: 'meeting_key'
  })
  meetingKey!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'driver_number'
  })
  driverNumber!: number;

  @Column(DataType.INTEGER)
  position!: number;

  @Column({
    type: DataType.INTEGER,
    field: 'grid_position'
  })
  gridPosition!: number;

  @Column({
    type: DataType.DECIMAL(10, 3),
    field: 'q1_time'
  })
  q1Time!: number | null;

  @Column({
    type: DataType.DECIMAL(10, 3),
    field: 'q2_time'
  })
  q2Time!: number | null;

  @Column({
    type: DataType.DECIMAL(10, 3),
    field: 'q3_time'
  })
  q3Time!: number | null;

  @Column({
    type: DataType.DECIMAL(12, 3),
    field: 'race_time'
  })
  raceTime!: number | null;

  @Column({
    type: DataType.STRING(20),
    field: 'gap_to_leader'
  })
  gapToLeader!: string | null;

  @Column({
    type: DataType.INTEGER,
    field: 'number_of_laps'
  })
  numberOfLaps!: number;

  @Column(DataType.STRING(50))
  status!: string;

  @Column({
    type: DataType.DECIMAL(5, 2),
    defaultValue: 0
  })
  points!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  dnf!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  dns!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  dsq!: boolean;

  @BelongsTo(() => Meeting)
  meeting!: Meeting;

  @BelongsTo(() => Session)
  session!: Session;

  // Get best qualifying time
  getBestQualifyingTime(): number | null {
    if (this.q3Time) return this.q3Time;
    if (this.q2Time) return this.q2Time;
    if (this.q1Time) return this.q1Time;
    return null;
  }

  // Format race time
  getFormattedRaceTime(): string {
    if (this.raceTime) {
      const mins = Math.floor(this.raceTime / 60);
      const secs = (this.raceTime % 60).toFixed(3);
      return `${mins}:${secs.padStart(6, '0')}`;
    }
    return this.status || '-';
  }
}