using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ExamNest.Migrations
{
    /// <inheritdoc />
    public partial class changecoursesisde : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Courses_CourseId",
                table: "Orders");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Courses_CourseId",
                table: "Orders",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "CourseId",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Orders_Courses_CourseId",
                table: "Orders");

            migrationBuilder.AddForeignKey(
                name: "FK_Orders_Courses_CourseId",
                table: "Orders",
                column: "CourseId",
                principalTable: "Courses",
                principalColumn: "CourseId");
        }
    }
}
