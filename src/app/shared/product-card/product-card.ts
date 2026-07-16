import { Component, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';

export interface ProductCardData {
  id: number;
  name: string;
  slug: string;
  price: number;
  imageUrl?: string;
}

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input({ required: true }) product!: ProductCardData;
}
