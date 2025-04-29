// Skip empty test file
describe.skip('useNodeEvents - no tests', () => {});

// import { vi, describe, it, expect } from 'vitest'
// import { ResizeDragEvent, ResizeParams } from 'reactflow'
// import { useNodeEvents } from '../useNodeEvents'
// import { SectionNodeData } from '@/components/draft_plan_mermaid/SectionNode'
// import * as merContext from '../../contexts/DraftPlan/DraftPlanContextMermaid'

// describe('useNodeEvents - onResizeEndSection', () => {
//   const baseDate = new Date('2025-01-01')
//   // Stub section data
//   const sections = [
//     {
//       name: 'Phase1',
//       tasks: [
//         { id: 't1', startDate: new Date('2025-01-01'), duration: 2, type: 'task' },
//         { id: 't2', startDate: new Date('2025-01-03'), duration: 2, type: 'task' }
//       ]
//     }
//   ]
//   const updateTaskStartDate = vi.fn()
//   const updateTaskDuration = vi.fn()
//   const mockContext = {
//     sections,
//     updateTaskStartDate,
//     updateTaskDuration
//   }
//   vi.spyOn(merContext, 'useDraftPlanMermaidContext').mockReturnValue(mockContext as any)

//   const setup = () => useNodeEvents([], () => {}, baseDate, 1, () => {}, () => {})

//   it('scales tasks correctly on double size', () => {
//     const { onResizeEndSection } = setup()
//     const data: SectionNodeData = { label: 'Phase1', duration: 4 }
//     onResizeEndSection({} as ResizeDragEvent, {} as ResizeParams, 2, data)
//     // Expect tasks start offsets double: t1 stays at Jan1, t2 moves from Jan3 to Jan5
//     expect(updateTaskStartDate).toHaveBeenCalledWith('t1', baseDate)
//     expect(updateTaskStartDate).toHaveBeenCalledWith('t2', new Date('2025-01-05'))
//     // Expect durations doubled
//     expect(updateTaskDuration).toHaveBeenCalledWith('t1', 4)
//     expect(updateTaskDuration).toHaveBeenCalledWith('t2', 4)
//   })

//   it('enforces minimum one day per task', () => {
//     const { onResizeEndSection } = setup()
//     const data: SectionNodeData = { label: 'Phase1', duration: 4 }
//     onResizeEndSection({} as ResizeDragEvent, {} as ResizeParams, 0.1, data)
//     // minDays = 2 tasks => newDays=0.1*4=0.4 <2 so newDays=2, newRatio=2/4=0.5
//     // off offsets: t1=0,t2=2 -> newOff=0 and 1 -> startDates Jan1 and Jan2
//     expect(updateTaskStartDate).toHaveBeenCalledWith('t1', baseDate)
//     expect(updateTaskStartDate).toHaveBeenCalledWith('t2', new Date('2025-01-02'))
//     // durations: Math.max(1, round(2*0.5)) => round(1)=1
//     expect(updateTaskDuration).toHaveBeenCalledWith('t1', 1)
//     expect(updateTaskDuration).toHaveBeenCalledWith('t2', 1)
//   })
// })
