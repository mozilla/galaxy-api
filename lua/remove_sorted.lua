local count = redis.call("ZCARD", KEYS[1])
local curPosition = redis.call("ZSCORE", KEYS[1], ARGV[1])

-- if game is not yet featured
if curPosition == false then
	return 0
-- if game is already featured
else
	local items = redis.call("ZRANGEBYSCORE", KEYS[1], curPosition + 1, count)
	for i, item in ipairs(items) do
		redis.call("ZINCRBY", KEYS[1], -1, item)
	end
	return redis.call("ZREM", KEYS[1], ARGV[1])
end
