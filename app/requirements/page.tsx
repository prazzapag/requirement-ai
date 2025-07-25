import PDFDropzone from "@/components/PDFDropzone";
import RequirementList from "@/components/RequirementList";

function Requirements() {
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/** PDF DropZone */}
        <PDFDropzone />
        <RequirementList />
      </div>
    </div>
  );
}
export default Requirements;
