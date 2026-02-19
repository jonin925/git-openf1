import { 
  Table, Column, Model, DataType, 
  HasMany, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement 
} from 'sequelize-typescript';
import Meeting from './Meeting';
import Driver from './Driver';
import Result from './Result';

@Table({
  tableName: 'sessions',
  timestamps: true,
  underscored: true
})
export default class Session extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
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
    field: 'circuit_key'
  })
  circuitKey!: number;

  @Column({
    type: DataType.STRING(100),
    field: 'circuit_short_name'
  })
  circuitShortName!: string;

  @Column(DataType.STRING(3))
  countryCode!: string;

  @Column(DataType.STRING(100))
  countryName!: string;

  @Column(DataType.INTEGER)
  year!: number;

  @Column({
    type: DataType.DATE,
    field: 'date_start'
  })
  dateStart!: Date;

  @Column({
    type: DataType.DATE,
    field: 'date_end'
  })
  dateEnd!: Date;

  @Column({
    type: DataType.STRING(10),
    field: 'gmt_offset'
  })
  gmtOffset!: string;

  @Column(DataType.STRING(100))
  location!: string;

  @Column({
    type: DataType.STRING(100),
    field: 'session_name'
  })
  sessionName!: string;

  @Column({
    type: DataType.STRING(50),
    field: 'session_type'
  })
  sessionType!: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  })
  isCompleted!: boolean;

  @BelongsTo(() => Meeting)
  meeting!: Meeting;

  @HasMany(() => Driver)
  drivers!: Driver[];

  @HasMany(() => Result)
  results!: Result[];

  // Check if session is currently live
  isLive(): boolean {
    const now = new Date();
    return now >= new Date(this.dateStart) && now <= new Date(this.dateEnd);
  }

  // Get session type category
  getCategory(): 'practice' | 'qualifying' | 'sprint_qualifying' | 'sprint_race' | 'race' {
    const name = this.sessionName.toLowerCase();
    
    if (name.includes('practice')) return 'practice';
    if (name.includes('sprint qualifying') || name.includes('sprint shootout')) return 'sprint_qualifying';
    if (name.includes('sprint') && name.includes('race')) return 'sprint_race';
    if (name.includes('qualifying')) return 'qualifying';
    if (name.includes('race')) return 'race';
    
    return 'practice';
  }

  // Static method to find live sessions
  static async findLiveSessions(): Promise<Session[]> {
    const now = new Date();
    return this.findAll({
      where: {
        dateStart: { $lte: now },
        dateEnd: { $gte: now }
      }
    });
  }
}