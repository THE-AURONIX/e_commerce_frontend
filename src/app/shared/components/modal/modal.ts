import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalService } from '../../../core/services/modal.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './modal.html',
  styleUrl: './modal.css'
})
export class ModalComponent {
  modalService = inject(ModalService);
  promptValue: string = '';

  onConfirm() {
    const state = this.modalService.modalState();
    if (state.type === 'confirm') {
      if (state.autoClose !== false) {
        this.modalService.closeModal(true);
      } else {
        if (state.resolve) {
          const resolve = state.resolve;
          this.modalService.modalState.update(s => ({ ...s, resolve: undefined }));
          resolve(true);
        }
      }
    } else {
      if (state.autoClose !== false) {
        this.modalService.closeModal(this.promptValue);
        this.promptValue = '';
      } else {
        if (state.resolve) {
          const resolve = state.resolve;
          this.modalService.modalState.update(s => ({ ...s, resolve: undefined }));
          resolve(this.promptValue);
        }
      }
    }
  }

  onCancel() {
    const state = this.modalService.modalState();
    if (state.isLoading) return;
    this.modalService.closeModal(false);
    this.promptValue = '';
  }
}
