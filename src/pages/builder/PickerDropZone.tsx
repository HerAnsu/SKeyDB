import {useDroppable} from '@dnd-kit/core';
import type {ReactNode} from 'react';

export interface PickerDropZoneProps {
  readonly id: string;
  readonly className: string;
  readonly children: ReactNode;
}

export function PickerDropZone({id, className, children}: PickerDropZoneProps) {
  const {setNodeRef} = useDroppable({id});

  return (
    <div className={className} ref={setNodeRef}>
      {children}
    </div>
  );
}
