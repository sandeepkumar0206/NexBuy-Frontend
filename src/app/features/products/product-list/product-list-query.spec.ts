import { convertToParamMap } from '@angular/router';
import { parseListQuery, toQueryParams } from './product-list-query';

/** Unit tests for the product list query helpers. */
describe('product-list-query', () => {
  describe('parseListQuery', () => {
    it('uses the defaults when the URL has no params', async () => {
      // Act
      const query = parseListQuery(convertToParamMap({}));

      // Assert
      expect(query).toEqual({ page: 1, size: 12, sort: 'newest' });
    });

    it('reads valid page, size and sort', async () => {
      // Act
      const query = parseListQuery(convertToParamMap({ page: '3', size: '24', sort: 'price_desc' }));

      // Assert
      expect(query).toEqual({ page: 3, size: 24, sort: 'price_desc' });
    });

    it('falls back to the defaults for invalid values', async () => {
      // Act
      const query = parseListQuery(convertToParamMap({ page: '0', size: '500', sort: 'cheapest' }));

      // Assert
      expect(query).toEqual({ page: 1, size: 12, sort: 'newest' });
    });

    it('ignores text that is not a number', async () => {
      // Act
      const query = parseListQuery(convertToParamMap({ page: 'abc', size: 'x' }));

      // Assert
      expect(query.page).toBe(1);
      expect(query.size).toBe(12);
    });
  });

  describe('toQueryParams', () => {
    it('leaves out the defaults', async () => {
      // Act
      const params = toQueryParams({ page: 1, size: 12, sort: 'newest' });

      // Assert
      expect(params).toEqual({});
    });

    it('keeps values that differ from the defaults', async () => {
      // Act
      const params = toQueryParams({ page: 2, size: 24, sort: 'name' });

      // Assert
      expect(params).toEqual({ page: 2, size: 24, sort: 'name' });
    });
  });
});
