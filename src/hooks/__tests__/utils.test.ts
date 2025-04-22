import { describe, it, expect, vi } from 'vitest'
import { calculateSectionResize, SectionTask } from '../utils'

describe('calculateSectionResize', () => {

  it('scales tasks correctly on double size', () => {
    const anchorDate = new Date('2025-01-01')
    const tasks: SectionTask[] = [
      { id: 't1', startDate: '2025-01-01', duration: 2, type: 'task' },
      { id: 't2', startDate: '2025-01-03', duration: 2, type: 'task' }
    ]
    const downstream: { id: string; newStartDate: Date }[] = []
    const mockDownstream = vi.fn((id, end, anchor, limit, output) => {})
    const { updates, downstreamUpdates } = calculateSectionResize(
      tasks,
      2,
      anchorDate,
      mockDownstream
    )
    expect(updates).toEqual([
      { id: 't1', newStartDate: new Date('2025-01-01'), newDuration: 4 },
      { id: 't2', newStartDate: new Date('2025-01-05'), newDuration: 4 }
    ])
    expect(downstreamUpdates).toEqual([])
    expect(mockDownstream).toHaveBeenCalledTimes(2)
  })

  it('enforces minimum one day per task', () => {
    const anchorDate = new Date('2025-01-01')
    const tasks: SectionTask[] = [
      { id: 't1', startDate: '2025-01-01', duration: 2, type: 'task' },
      { id: 't2', startDate: '2025-01-03', duration: 2, type: 'task' }
    ]
    const mockDownstream = vi.fn()
    const { updates } = calculateSectionResize(
      tasks,
      0.1,
      anchorDate,
      mockDownstream
    )
    expect(updates).toEqual([
      { id: 't1', newStartDate: new Date('2025-01-01'), newDuration: 1 },
      { id: 't2', newStartDate: new Date('2025-01-02'), newDuration: 1 }
    ])
  })

  it('correctly handles milestones', () => {
    const anchorDate = new Date('2025-01-01')
    const tasks: SectionTask[] = [
      { id: 't1', startDate: '2025-01-1', duration: 10, type: 'task' },
      { id: 't2', startDate: '2025-01-11', duration: 10, type: 'task' },
      { id: 'milestone', startDate: '2025-01-21', type: 'milestone' }
    ]
    const mockDownstream = vi.fn()
    const { updates } = calculateSectionResize(
      tasks,
      0.5,
      anchorDate,
      mockDownstream
    )
    expect(updates).toEqual([
      { id: 't1', newStartDate: new Date('2025-01-01'), newDuration: 5 },
      { id: 't2', newStartDate: new Date('2025-01-6'), newDuration: 5 },
      { id: 'milestone', newStartDate: new Date('2025-01-11')}
    ])
  })

  it('correctly handles milestones', () => {
    const anchorDate = new Date('2025-01-01')
    const tasks: SectionTask[] = [
      { id: 't1', startDate: '2025-01-1', duration: 10, type: 'task' },
      { id: 't2', startDate: '2025-01-11', duration: 10, type: 'task' },
      { id: 'milestone', startDate: '2025-01-21', type: 'milestone' }
    ]
    const mockDownstream = vi.fn()
    const { updates } = calculateSectionResize(
      tasks,
      0.5,
      anchorDate,
      mockDownstream
    )
    expect(updates).toEqual([
      { id: 't1', newStartDate: new Date('2025-01-01'), newDuration: 5 },
      { id: 't2', newStartDate: new Date('2025-01-6'), newDuration: 5 },
      { id: 'milestone', newStartDate: new Date('2025-01-11')}
    ])
  })

  it('correctly handles new ', () => {
    const anchorDate = new Date('2025-01-01')
    const tasks: SectionTask[] = [
      {id: 'digitalmodel', startDate: '2024-05-19T00:00:00.000Z', duration: 17, type: 'task'},
      {id: 'construct25', startDate: '2024-06-05T00:00:00.000Z', duration: 18, type: 'task'},
      {id: '25_scale_model_complete', startDate: '2024-06-23T00:00:00.000Z', duration: 0, type: 'milestone'},
      {id: 'proportion_model_completed', startDate: '2024-06-23T00:00:00.000Z', duration: 0, type: 'milestone'}
    ]
    const mockDownstream = vi.fn()
    const { updates } = calculateSectionResize(
      tasks,
      0.5,
      anchorDate,
      mockDownstream
    )
    expect(updates).toEqual([
      { id: 'digitalmodel', newStartDate: new Date('2024-05-19'), newDuration: 9 },
      { id: 'construct25', newStartDate: new Date('2024-05-28'), newDuration: 9 },
      { id: '25_scale_model_complete', newStartDate: new Date('2024-06-06')},   
      { id: 'proportion_model_completed', newStartDate: new Date('2024-06-06')}
    ])
  })
})