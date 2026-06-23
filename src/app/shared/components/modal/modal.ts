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
      this.modalService.closeModal(true);
    } else {
      this.modalService.closeModal(this.promptValue);
      this.promptValue = '';
    }
  }

  onCancel() {
    const state = this.modalService.modalState();
    if (state.type === 'confirm') {
      this.modalService.closeModal(false);
    } else {
      this.modalService.closeModal(null);
      this.promptValue = '';
    }
  }
}
