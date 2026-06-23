import { Injectable, signal } from '@angular/core';

export interface ModalState {
  isOpen: boolean;
  type: 'confirm' | 'prompt';
  title: string;
  message: string;
  inputPlaceholder?: string;
  resolve?: (value: any) => void;
}

@Injectable({
  providedIn: 'root'
})
export class ModalService {
  modalState = signal<ModalState>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: ''
  });

  confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      this.modalState.set({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        resolve
      });
    });
  }

  prompt(title: string, message: string, inputPlaceholder?: string): Promise<string | null> {
    return new Promise((resolve) => {
      this.modalState.set({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        inputPlaceholder,
        resolve
      });
    });
  }

  closeModal(result: any) {
    const currentState = this.modalState();
    if (currentState.resolve) {
      currentState.resolve(result);
    }
    this.modalState.set({
      isOpen: false,
      type: 'confirm',
      title: '',
      message: ''
    });
  }
}
