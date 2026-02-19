import { 
  Table, Column, Model, DataType, 
  HasMany, ForeignKey, BelongsTo, PrimaryKey, AutoIncrement 
} from 'sequelize-typescript';
import Year from './Year';
import Session from './Session';
import Driver from './Driver';
import Result from './Result';

@Table({
  tableName: 'meetings',
  timestamps: true,
  underscored: true
})
export default class Meeting extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true,
    field: 'meeting_key'
  })
  meetingKey!: number;

  @ForeignKey(() => Year)
  @Column({
    type: DataType.INTEGER,
    field: 'year'
  })
  year!: number;

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

  @Column({
    type: DataType.STRING(50),
    field: 'circuit_type'
  })
  circuitType!: string;

  @Column(DataType.STRING(3))
  countryCode!: string;

  @Column(DataType.STRING(100))
  countryName!: string;

  @Column(DataType.TEXT)
  countryFlag!: string;

  @Column(DataType.STRING(100))
  location!: string;

  @Column(DataType.STRING(200))
  meetingName!: string;

  @Column({
    type: DataType.STRING(300),
    field: 'meeting_official_name'
  })
  meetingOfficialName!: string;

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

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_completed'
  })
  isCompleted!: boolean;

  @Column({
    type: DataType.INTEGER,
    field: 'winner_driver_number'
  })
  winnerDriverNumber!: number | null;

  @Column({
    type: DataType.STRING(100),
    field: 'winner_constructor_name'
  })
  winnerConstructorName!: string | null;

  @BelongsTo(() => Year)
  yearData!: Year;

  @HasMany(() => Session)
  sessions!: Session[];

  @HasMany(() => Driver)
  drivers!: Driver[];

  @HasMany(() => Result)
  results!: Result[];

  // Check if race is completed based on date
  async checkCompletionStatus(): Promise<boolean> {
    const now = new Date();
    const raceDate = new Date(this.dateEnd);
    const isCompleted = now > raceDate;
    
    if (isCompleted !== this.isCompleted) {
      this.isCompleted = isCompleted;
      await this.save();
    }
    
    return isCompleted;
  }

  // Get winner info from results
  async updateWinnerInfo(): Promise<void> {
    if (!this.isCompleted) return;

    const raceSession = await Session.findOne({
      where: { meetingKey: this.meetingKey, sessionType: 'Race' },
      include: [{
        model: Result,
        where: { position: 1 }
      }]
    });

    if (raceSession && raceSession.results && raceSession.results.length > 0) {
      const winner = raceSession.results[0];
      this.winnerDriverNumber = winner.driverNumber;
      
      const driver = await Driver.findOne({
        where: { driverNumber: winner.driverNumber, meetingKey: this.meetingKey }
      });
      
      if (driver) {
        this.winnerConstructorName = driver.teamName;
      }
      
      await this.save();
    }
  }
}