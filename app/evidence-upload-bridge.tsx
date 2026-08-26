'use client';

import { useEffect } from 'react';

const ACCEPT = 'image/*,.pdf,.txt,.webp,.jpg,.jpeg,.png';

export default function EvidenceUploadBridge() {
  useEffect(() => {
    let input: HTMLInputElement | null = null;
    let targetButton: HTMLButtonElement | null = null;
    let allowNextClick = false;

    const ensureInput = () => {
      if (input) return input;
      input = document.createElement('input');
      input.type = 'file';
      input.accept = ACCEPT;
      input.hidden = true;
      input.setAttribute('aria-hidden', 'true');
      document.body.appendChild(input);
      input.addEventListener('change', () => {
        const file = input?.files?.[0];
        if (!file || !targetButton) return;
        const small = targetButton.querySelector('small');
        if (small) small.textContent = file.name;
        targetButton.dataset.uploaded = 'true';
        targetButton.dataset.filename = file.name;
        targetButton.classList.add('evidence-uploaded');
        input!.value = '';
        allowNextClick = true;
        targetButton.click();
        allowNextClick = false;
      });
      return input;
    };

    const onClick = (event: MouseEvent) => {
      const button = (event.target as HTMLElement)?.closest<HTMLButtonElement>('.evidence-grid button');
      if (!button || allowNextClick) return;
      const label = button.querySelector('b')?.textContent?.trim() || '';
      if (label !== 'Screenshot') return;
      event.preventDefault();
      event.stopPropagation();
      targetButton = button;
      ensureInput().click();
    };

    document.addEventListener('click', onClick, true);
    return () => {
      document.removeEventListener('click', onClick, true);
      input?.remove();
    };
  }, []);

  return null;
}
