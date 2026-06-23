import { Injectable, signal } from '@angular/core';

export interface ModalState {
  isOpen: boolean;
  type: 'confirm' | 'prompt';
  title: string;
  message: string;
  inputPlaceholder?: string;
  resolve?: (value: any) => void;
  isLoading?: boolean;
  autoClose?: boolean;
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

  confirm(title: string, message: string, autoClose = true): Promise<boolean> {
    return new Promise((resolve) => {
      this.modalState.set({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        resolve,
        isLoading: false,
        autoClose
      });
    });
  }

  prompt(title: string, message: string, inputPlaceholder?: string, autoClose = true): Promise<string | null> {
    return new Promise((resolve) => {
      this.modalState.set({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        inputPlaceholder,
        resolve,
        isLoading: false,
        autoClose
      });
    });
  }

  setLoading(isLoading: boolean) {
    this.modalState.update(state => ({ ...state, isLoading }));
  }

  closeModal(result?: any) {
    const currentState = this.modalState();
    if (currentState.resolve && result !== undefined) {
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
