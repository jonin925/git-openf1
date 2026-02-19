import { Table, Column, Model, DataType, HasMany, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import Meeting from './Meeting';

@Table({
  tableName: 'years',
  timestamps: true,
  underscored: true
})
export default class Year extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    unique: true
  })
  year!: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: 'is_current'
  })
  isCurrent!: boolean;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
    field: 'total_races'
  })
  totalRaces!: number;

  @HasMany(() => Meeting)
  meetings!: Meeting[];

  // Helper method to get or create year
  static async getOrCreate(year: number): Promise<Year> {
    const [instance, created] = await this.findOrCreate({
      where: { year },
      defaults: { year, isCurrent: year === new Date().getFullYear() }
    });
    return instance;
  }

  // Update current year flag
  static async updateCurrentYear(): Promise<void> {
    const currentYear = new Date().getFullYear();
    await this.update({ isCurrent: false }, { where: {} });
    await this.update({ isCurrent: true }, { where: { year: currentYear } });
  }
}