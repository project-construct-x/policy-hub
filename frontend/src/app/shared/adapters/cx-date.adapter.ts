import { Injectable } from '@angular/core';
import { NativeDateAdapter } from '@angular/material/core';

@Injectable()
export class CxDateAdapter extends NativeDateAdapter {
  override format(date: Date, displayFormat: unknown): string {
    if (displayFormat === 'DD.MM.YYYY') {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    }
    return super.format(date, displayFormat as object);
  }

  override parse(value: string | number): Date | null {
    if (typeof value === 'string') {
      const match = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(value.trim());
      if (match) {
        const [, d, m, y] = match;
        return new Date(+y, +m - 1, +d);
      }
    }
    return super.parse(value);
  }
}
