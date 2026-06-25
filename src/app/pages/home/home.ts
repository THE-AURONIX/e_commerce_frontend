import { Component, AfterViewInit, ElementRef, inject, signal, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductService } from '../../core/services/product.service';
import { Product } from '../../core/models/product.model';
import { ProductCard } from '../../shared/components/product-card/product-card';

declare var gsap: any;
declare var ScrollTrigger: any;
declare var Lenis: any;

@Component({
  selector: 'app-home',
  imports: [CommonModule, RouterLink, ProductCard],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements AfterViewInit, OnDestroy {
  private platformId = inject(PLATFORM_ID);
  private el = inject(ElementRef);
  private productService = inject(ProductService);
  
  spotlightProducts = signal<Product[]>([]);
  newArrivals = signal<Product[]>([]);
  private lenis: any;
  private animationFrameId: number = 0;

  constructor() {
    this.productService.getProducts({ limit: 20 }).subscribe({
      next: (res) => {
        const products = res.products || [];
        this.spotlightProducts.set(products.slice(0, 4));
        
        const shuffled = [...products].sort(() => 0.5 - Math.random());
        this.newArrivals.set(shuffled.slice(0, 5));
      },
      error: (err) => console.error('Error fetching products', err)
    });
  }

  scrollCarousel(direction: number) {
    if (isPlatformBrowser(this.platformId)) {
      const container = this.el.nativeElement.querySelector('.carousel-container');
      if (container) {
        const scrollAmount = 300 * direction;
        container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
      }
    }
  }

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      // 1. Initialize Lenis (Smooth Scrolling)
      this.lenis = new Lenis({
          lerp: 0.1, 
          smoothWheel: true,
          smoothTouch: false,
      });

      const raf = (time: number) => {
          this.lenis.raf(time);
          this.animationFrameId = requestAnimationFrame(raf);
      };
      this.animationFrameId = requestAnimationFrame(raf);

      // 2. Initialize GSAP ScrollTrigger
      gsap.registerPlugin(ScrollTrigger);

      // Hero Section Initial Reveal
      gsap.from('.gs-reveal', {
          y: 30,
          opacity: 0,
          duration: 1,
          stagger: 0.15,
          ease: 'power3.out',
          delay: 0.2
      });

      // Simple Fade Up for elements like headings and category circles
      const upElements = document.querySelectorAll('.gs-up');
      upElements.forEach((el) => {
          gsap.from(el, {
              scrollTrigger: {
                  trigger: el,
                  start: 'top 85%',
                  toggleActions: 'play none none reverse'
              },
              y: 40,
              opacity: 0,
              duration: 0.8,
              ease: 'power2.out'
          });
      });

      // Staggered reveal for Product Cards
      gsap.from('.gs-stagger', {
          scrollTrigger: {
              trigger: '.product-grid',
              start: 'top 80%',
              toggleActions: 'play none none reverse'
          },
          y: 50,
          opacity: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: 'power2.out'
      });
    }
  }

  ngOnDestroy(): void {
    if (isPlatformBrowser(this.platformId)) {
      if (this.lenis) {
        this.lenis.destroy();
      }
      cancelAnimationFrame(this.animationFrameId);
      
      // Kill GSAP ScrollTriggers to prevent memory leaks on navigation
      ScrollTrigger.getAll().forEach((st: any) => st.kill());
    }
  }
}
