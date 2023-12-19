const DisplayError = ({ error }: { error: string }) => {
  return (
    <p className="mt-2 text-sm text-red-500" key={error}>
      {error}
    </p>
  );
};

export default DisplayError;
