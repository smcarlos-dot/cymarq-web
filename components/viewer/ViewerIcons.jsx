'use client';

/**
 * Iconografía mínima del visor 3D (trazo fino, coherente con el sitio).
 */
const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

const Svg = ({ children, className = 'h-4 w-4' }) => (
  <svg {...base} className={className}>
    {children}
  </svg>
);

export const IconInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5M12 8h.01" />
  </Svg>
);

export const IconExpand = (p) => (
  <Svg {...p}>
    <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
  </Svg>
);

export const IconCollapse = (p) => (
  <Svg {...p}>
    <path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" />
  </Svg>
);

export const IconEyeOff = (p) => (
  <Svg {...p}>
    <path d="M3 3l18 18" />
    <path d="M10.6 6.3A9.6 9.6 0 0 1 12 6.2c5 0 9 5.8 9 5.8a17 17 0 0 1-3.1 3.6M6.5 8.2A17 17 0 0 0 3 12s4 5.8 9 5.8a8.6 8.6 0 0 0 3.4-.7" />
    <path d="M9.9 10a3 3 0 0 0 4.2 4.2" />
  </Svg>
);

export const IconEye = (p) => (
  <Svg {...p}>
    <path d="M3 12s4-5.8 9-5.8S21 12 21 12s-4 5.8-9 5.8S3 12 3 12Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Svg>
);

export const IconFit = (p) => (
  <Svg {...p}>
    <path d="M4 8V4h4M20 8V4h-4M4 16v4h4M20 16v4h-4" />
    <rect x="9" y="9" width="6" height="6" />
  </Svg>
);

export const IconReset = (p) => (
  <Svg {...p}>
    <path d="M4 12a8 8 0 1 0 2.6-5.9" />
    <path d="M4 4v4h4" />
  </Svg>
);

export const IconRotate = (p) => (
  <Svg {...p}>
    <ellipse cx="12" cy="12" rx="9" ry="4" />
    <path d="M12 3.2v17.6" />
    <circle cx="12" cy="12" r="1.4" />
  </Svg>
);

export const IconGrid = (p) => (
  <Svg {...p}>
    <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
  </Svg>
);

export const IconAxes = (p) => (
  <Svg {...p}>
    <path d="M12 20V7M12 20l-8-4M12 20l8-4" />
    <path d="M12 7l-2.2 2.4M12 7l2.2 2.4" />
  </Svg>
);

export const IconClose = (p) => (
  <Svg {...p}>
    <path d="M6 6l12 12M18 6L6 18" />
  </Svg>
);

export const IconLayers = (p) => (
  <Svg {...p}>
    <path d="M12 3.5 3 8l9 4.5L21 8l-9-4.5Z" />
    <path d="M3 12.5 12 17l9-4.5" />
  </Svg>
);

export const IconCube = (p) => (
  <Svg {...p}>
    <path d="M12 3 4 7.2v9.6L12 21l8-4.2V7.2L12 3Z" />
    <path d="M4 7.2 12 11.5l8-4.3M12 11.5V21" />
  </Svg>
);
