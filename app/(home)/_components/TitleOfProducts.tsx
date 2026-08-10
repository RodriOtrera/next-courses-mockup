interface TitleProducsProps {
  title: string;
  content: string;
}

export const TitleOfProduts: React.FC<TitleProducsProps> = ({
  content,
  title,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r text-transparent bg-clip-text from-red-500 to-purple-500">
        {title.toUpperCase()}
      </h2>
      <p className="text-gray-400 text-sm">
        {content}
      </p>
    </div>
  );
};
