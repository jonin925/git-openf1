import { 
  Table, Column, Model, DataType, 
  ForeignKey, BelongsTo, PrimaryKey, AutoIncrement 
} from 'sequelize-typescript';
import Meeting from './Meeting';
import Session from './Session';

@Table({
  tableName: 'drivers',
  timestamps: true,
  underscored: true,
  indexes: [
    { unique: true, fields: ['driver_number', 'session_key'] }
  ]
})
export default class Driver extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    field: 'driver_number'
  })
  driverNumber!: number;

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
    type: DataType.STRING(100),
    field: 'broadcast_name'
  })
  broadcastName!: string;

  @Column({
    type: DataType.STRING(50),
    field: 'first_name'
  })
  firstName!: string;

  @Column({
    type: DataType.STRING(50),
    field: 'last_name'
  })
  lastName!: string;

  @Column({
    type: DataType.STRING(100),
    field: 'full_name'
  })
  fullName!: string;

  @Column({
    type: DataType.STRING(3),
    field: 'name_acronym'
  })
  nameAcronym!: string;

  @Column({
    type: DataType.STRING(100),
    field: 'team_name'
  })
  teamName!: string;

  @Column({
    type: DataType.STRING(10),
    field: 'team_colour'
  })
  teamColour!: string;

  @Column({
    type: DataType.TEXT,
    field: 'headshot_url'
  })
  headshotUrl!: string;

  @Column({
    type: DataType.STRING(3),
    field: 'country_code'
  })
  countryCode!: string;

  @BelongsTo(() => Meeting)
  meeting!: Meeting;

  @BelongsTo(() => Session)
  session!: Session;

  // Get full display name
  getDisplayName(): string {
    return this.fullName || `${this.firstName} ${this.lastName}`;
  }

  // Get team color with # prefix
  getTeamColorHex(): string {
    return this.teamColour ? `#${this.teamColour}` : '#000000';
  }
}