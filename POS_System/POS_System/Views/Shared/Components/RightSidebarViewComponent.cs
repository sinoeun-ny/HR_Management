using Microsoft.AspNetCore.Mvc;

namespace POS_System.Views.Shared.Components
{
    public class RightSidebarViewComponent : ViewComponent
    {
        // Asynchronous method (keep only this)
        public async Task<IViewComponentResult> InvokeAsync()
        {
            return await Task.FromResult(View("rightSidebar"));
        }
    }
}
