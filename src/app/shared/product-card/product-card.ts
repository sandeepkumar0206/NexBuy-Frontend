import { Component, Input } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { Product } from '../../core/models/product.model';

export const PLACEHOLDER_IMAGE = 'https://placehold.co/400x300?text=NexBuy';

@Component({
  selector: 'app-product-card',
  imports: [CurrencyPipe, RouterLink, MatCardModule, MatButtonModule],
  templateUrl: './product-card.html',
  styleUrl: './product-card.scss',
})
export class ProductCard {
  @Input({ required: true }) product!: Product;

  get imageUrl(): string {
    return this.product.images[0] || PLACEHOLDER_IMAGE;
  }

  get onSale(): boolean {
    return this.product.discountedPrice < this.product.price;
  }

  onImageError(event: Event): void {
    (event.target as HTMLImageElement).src = PLACEHOLDER_IMAGE;
  }
}
