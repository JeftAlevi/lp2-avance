import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { ProductoForm } from './producto-form';
import { ProductoService } from './producto-service';
import { CategoriaService } from '../categoria/categoria-service';

describe('ProductoForm autocomplete', () => {
  const categorias = [
    { id: 1, nombre: 'Igual' },
    { id: 2, nombre: 'Igual' },
  ];
  const producto = { id: 4, nombre: 'Producto', precio: 10, stock: 1, categoria: categorias[1] };
  let service: {
    crear: ReturnType<typeof vi.fn>;
    actualizar: ReturnType<typeof vi.fn>;
    obtener: ReturnType<typeof vi.fn>;
  };
  function create(edit = false) {
    service = {
      crear: vi.fn(() => new Subject()),
      actualizar: vi.fn(() => new Subject()),
      obtener: vi.fn(() => of(producto)),
    };
    TestBed.configureTestingModule({
      imports: [ProductoForm],
      providers: [
        provideRouter([]),
        { provide: ProductoService, useValue: service },
        { provide: CategoriaService, useValue: { listar: () => of(categorias) } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(edit ? { id: '4' } : {}) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(ProductoForm);
    fixture.detectChanges();
    return fixture;
  }
  it('sends the selected ID even when names are equal', () => {
    const fixture = create();
    fixture.componentInstance['form'].setValue({
      nombre: 'Producto',
      precio: 10,
      stock: 1,
      categoria: categorias[1],
    });
    fixture.componentInstance.guardar();
    expect(service.crear).toHaveBeenCalledWith({
      nombre: 'Producto',
      precio: 10,
      stock: 1,
      categoriaId: 2,
    });
  });
  it('rejects free text after selecting a category and shows a Material error', async () => {
    const fixture = create();
    const form = fixture.componentInstance['form'];
    form.setValue({ nombre: 'Producto', precio: 10, stock: 1, categoria: categorias[1] });
    const input: HTMLInputElement = fixture.nativeElement.querySelector(
      '[formControlName="categoria"]',
    );
    input.value = 'Otro texto';
    input.dispatchEvent(new Event('input'));
    fixture.componentInstance.guardar();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(service.crear).not.toHaveBeenCalled();
    expect(form.controls.categoria.invalid).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-error')).not.toBeNull();
  });
  it('displays the current name during editing and keeps the original ID', async () => {
    const fixture = create(true);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[formControlName="categoria"]').value).toBe(
      'Igual',
    );
    fixture.componentInstance.guardar();
    expect(service.actualizar).toHaveBeenCalledWith(4, {
      nombre: 'Producto',
      precio: 10,
      stock: 1,
      categoriaId: 2,
    });
  });
});
