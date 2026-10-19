using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using StockHub.Database;
using StockHub.Errors;
using StockHub.Models;
using StockHub.Repositories;
using StockHub.Services;

namespace StockHub.Controllers.Stocks;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class StocksController : ControllerBase
{
    [HttpGet("{portfolioId?}")]
    public async Task<ActionResult<ApiActionResult<IEnumerable<Stock>>>> Get(
        [FromServices] StockRepo stockRepo,
        [FromRoute] string portfolioId = "",
        [FromQuery] string stockId = "",
        [FromQuery] bool isOpenPosOnly = false,
        [FromQuery] bool isOrderByPosVal = false,
        [FromQuery] string assetClasses = "")
    {
        var apiActionResult = new ApiActionResult<IEnumerable<Stock>>
        {
            Payload = await stockRepo.GetAsync(portfolioId, stockId, isOpenPosOnly, isOrderByPosVal, assetClasses)
        };
        return apiActionResult;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ApiActionResult<Stock>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiActionResult<Stock>>> Post(
        [FromServices] StocksService stocksService,
        [FromServices] StockPostDtoValidator validator,
        StockPostDto dto)
    {
        var apiActionResult = new ApiActionResult<Stock>();

        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            foreach (var error in validation.Errors)
            {
                apiActionResult.HookErrors.Add(new HookError(error.PropertyName, error.ErrorMessage));
            }

            return BadRequest(apiActionResult);
        }

        apiActionResult.Payload = await stocksService.CreateAsync(dto);
        return apiActionResult;
    }

    [HttpPut]
    [ProducesResponseType(typeof(ApiActionResult<Stock>), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ApiActionResult<Stock>>> Put(
        [FromServices] StocksService stocksService,
        [FromServices] StockPutDtoValidator validator,
        StockPutDto dto)
    {
        var apiActionResult = new ApiActionResult<Stock>();

        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            foreach (var error in validation.Errors)
            {
                apiActionResult.HookErrors.Add(new HookError(error.PropertyName, error.ErrorMessage));
            }

            return BadRequest(apiActionResult);
        }

        apiActionResult.Payload = await stocksService.UpdateAsync(dto);
        return apiActionResult;
    }

    [HttpDelete]
    public async Task<ActionResult<ApiActionResult<Stock>>> Delete(
        [FromServices] StocksService stocksService,
        [FromServices] StockDeleteDtoValidator validator,
        StockDeleteDto dto)
    {
        var apiActionResult = new ApiActionResult<Stock>();

        var validation = await validator.ValidateAsync(dto);
        if (!validation.IsValid)
        {
            foreach (var error in validation.Errors)
            {
                apiActionResult.HookErrors.Add(new HookError(error.PropertyName, error.ErrorMessage));
            }

            return BadRequest(apiActionResult);
        }

        var stock = await stocksService.DeleteAsync(dto.stockId);

        if (stock == null)
        {
            apiActionResult.IsSuccess = false;
            apiActionResult.Message = "Entry to delete not found";
            return BadRequest(apiActionResult);
        }

        apiActionResult.Payload = stock;
        return apiActionResult;
    }
}