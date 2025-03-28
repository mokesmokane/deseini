interface MonthNodeProps {
  data: {
    label: string;
    width: number;
  };
}

export const MonthNode = ({ data }: MonthNodeProps) => (
  <div 
    className="border-r border-gray-200 flex items-center justify-center font-medium bg-white h-12"
    style={{ width: data.width }}
  >
    {data.label}
  </div>
);
